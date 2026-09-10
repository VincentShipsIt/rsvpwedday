"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MAX_CHILDREN_UNDER_12 } from "@/domain/children";
import { retireUniqueValue } from "@/domain/soft-delete";
import { newToken } from "@/domain/token";
import { GuestKind, Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";
import { syncHouseholdAttendance } from "@/lib/household-attendance";
import { requireAdmin } from "@/lib/require-admin";

const guestSchema = z.object({
	id: z.string().min(1).optional(),
	firstName: z.string().trim().min(1).max(100),
	lastName: z.string().trim().min(1).max(100),
	kind: z.literal(GuestKind.ADULT).default(GuestKind.ADULT),
	email: z.union([z.email(), z.literal("")]),
	phone: z.string().trim().max(30),
});
const invitationSchema = z
	.object({
		email: z.email().transform((value) => value.toLowerCase()),
		locale: z.enum(Locale),
		companionAllowance: z.number().int().min(0).max(20),
		childrenUnder12: z.number().int().min(0).max(MAX_CHILDREN_UNDER_12).default(0),
		guests: z.array(guestSchema).min(1).max(100),
		eventIds: z.array(z.string().min(1)).min(1).max(100),
	})
	.refine((value) => new Set(value.eventIds).size === value.eventIds.length, {
		message: "Duplicate event",
	});
export type InvitationGuestInput = z.infer<typeof guestSchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;

function guestData(guest: InvitationGuestInput) {
	return {
		firstName: guest.firstName,
		lastName: guest.lastName,
		kind: GuestKind.ADULT,
		email: guest.email || null,
		phone: guest.phone || null,
	};
}
async function validEvents(ids: string[]) {
	const events = await db.event.findMany({ where: { id: { in: ids } }, select: { id: true } });
	return events.length === ids.length;
}
function saved() {
	revalidatePath("/admin", "layout");
	revalidatePath("/rsvp/[token]", "page");
}
function failure(error: unknown): FormActionResult {
	if (typeof error === "object" && error && "code" in error && error.code === "P2002")
		return { ok: false, error: "An invitation already uses this email." };
	console.error("Invitation save failed", error);
	return { ok: false, error: "Could not save the invitation. Reload and try again." };
}
export async function createInvitation(input: InvitationInput): Promise<FormActionResult> {
	await requireAdmin();
	const result = invitationSchema.safeParse(input);
	if (!result.success)
		return { ok: false, error: result.error.issues[0]?.message ?? "Check the invitation fields." };
	const value = result.data;
	if (!(await validEvents(value.eventIds))) return { ok: false, error: "Pick existing events." };
	try {
		await db.invitation.create({
			data: {
				email: value.email,
				locale: value.locale,
				companionAllowance: value.companionAllowance,
				childrenUnder12: value.childrenUnder12,
				token: newToken(),
				guests: {
					create: value.guests.map((guest) => ({
						...guestData(guest),
						attendance: { create: value.eventIds.map((eventId) => ({ eventId })) },
					})),
				},
				childAttendance: { create: value.eventIds.map((eventId) => ({ eventId, count: 0 })) },
			},
		});
	} catch (error) {
		return failure(error);
	}
	saved();
	return { ok: true };
}
export async function updateInvitation(
	invitationId: string,
	input: InvitationInput
): Promise<FormActionResult> {
	await requireAdmin();
	const result = invitationSchema.safeParse(input);
	if (!result.success)
		return { ok: false, error: result.error.issues[0]?.message ?? "Check the invitation fields." };
	const value = result.data;
	if (!(await validEvents(value.eventIds))) return { ok: false, error: "Pick existing events." };
	try {
		const valid = await db.$transaction(
			async (tx) => {
				const existing = await tx.guest.findMany({
					where: { invitationId, addedByGuest: false, kind: GuestKind.ADULT },
				});
				const existingIds = new Set(existing.map((guest) => guest.id));
				const ids = value.guests.flatMap((guest) => (guest.id ? [guest.id] : []));
				if (new Set(ids).size !== ids.length || ids.some((id) => !existingIds.has(id)))
					return false;
				await tx.guest.updateMany({
					where: { invitationId, addedByGuest: false, kind: GuestKind.ADULT, id: { notIn: ids } },
					data: { deletedAt: new Date() },
				});
				for (const guest of value.guests) {
					if (guest.id) await tx.guest.update({ where: { id: guest.id }, data: guestData(guest) });
					else await tx.guest.create({ data: { invitationId, ...guestData(guest) } });
				}
				await syncHouseholdAttendance(tx, invitationId, value.eventIds, value.childrenUnder12);
				await tx.invitation.update({
					where: { id: invitationId },
					data: {
						email: value.email,
						locale: value.locale,
						companionAllowance: value.companionAllowance,
						childrenUnder12: value.childrenUnder12,
					},
				});
				return true;
			},
			{ isolationLevel: "Serializable" }
		);
		if (!valid) return { ok: false, error: "The guest list changed. Reload before saving." };
	} catch (error) {
		return failure(error);
	}
	saved();
	return { ok: true };
}
/*
 * Removes a household without destroying it. `onDelete: Cascade` no longer fires, so the guests
 * and the photos they added are marked by hand — otherwise they would outlive the invitation and
 * the photo book would still show them.
 *
 * The email and the token are unique, so they leave the live namespace too: without that,
 * re-importing this household's CSV row would look the email up, not find it (reads hide deleted
 * rows), try to create it, and collide.
 *
 * Their uploaded files are deliberately *not* queued for storage cleanup. That pipeline exists to
 * sweep abandoned upload batches nobody ever registered, and it still does; destroying the files
 * of a household somebody deleted on purpose would make this the one delete that cannot be undone,
 * since a restored photo row pointing at a deleted object is not a photo. Whatever eventually
 * purges tombstones is what should take the files with them.
 */
export async function deleteInvitation(invitationId: string): Promise<void> {
	await requireAdmin();
	const invitation = await db.invitation.findUnique({
		where: { id: invitationId },
		select: { email: true, token: true },
	});
	if (invitation) {
		const now = new Date();
		await db.$transaction(async (tx) => {
			await tx.guest.updateMany({ where: { invitationId }, data: { deletedAt: now } });
			await tx.photo.updateMany({ where: { invitationId }, data: { deletedAt: now } });
			await tx.invitation.update({
				where: { id: invitationId },
				data: {
					deletedAt: now,
					email: retireUniqueValue(invitation.email, now),
					token: retireUniqueValue(invitation.token, now),
				},
			});
		});
	}
	saved();
	redirect("/admin/guests");
}
