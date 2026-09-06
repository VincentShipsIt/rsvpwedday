"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newToken } from "@/domain/token";
import type { GuestKind, Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";

export type InvitationGuestInput = {
	id?: string;
	firstName: string;
	lastName: string;
	kind: GuestKind;
	email: string;
	phone: string;
};

export type InvitationInput = {
	email: string;
	locale: Locale;
	companionAllowance: number;
	guests: InvitationGuestInput[];
};

function toGuestData(guest: InvitationGuestInput) {
	return {
		firstName: guest.firstName,
		lastName: guest.lastName,
		kind: guest.kind,
		email: guest.email || null,
		phone: guest.phone || null,
	};
}

export async function createInvitation(input: InvitationInput): Promise<FormActionResult> {
	if (!input.email || input.guests.length === 0) {
		return { ok: false, error: "Email and at least one guest are required" };
	}

	const events = await db.event.findMany({ select: { id: true } });

	await db.invitation.create({
		data: {
			email: input.email,
			locale: input.locale,
			companionAllowance: input.companionAllowance,
			token: newToken(),
			guests: {
				create: input.guests.map((guest) => ({
					...toGuestData(guest),
					attendance: { create: events.map((event) => ({ eventId: event.id })) },
				})),
			},
		},
	});

	revalidatePath("/admin");
	return { ok: true };
}

export async function updateInvitation(
	invitationId: string,
	input: InvitationInput
): Promise<FormActionResult> {
	if (!input.email || input.guests.length === 0) {
		return { ok: false, error: "Email and at least one guest are required" };
	}

	const events = await db.event.findMany({ select: { id: true } });
	const existingGuests = await db.guest.findMany({
		where: { invitationId, addedByGuest: false },
	});
	const existingGuestIds = new Set(existingGuests.map((guest) => guest.id));
	const submittedGuestIds = new Set(
		input.guests.filter((guest) => guest.id).map((guest) => guest.id)
	);

	await db.$transaction(async (tx) => {
		for (const guestId of existingGuestIds) {
			if (!submittedGuestIds.has(guestId)) {
				await tx.guest.delete({ where: { id: guestId } });
			}
		}

		for (const guest of input.guests) {
			if (guest.id && existingGuestIds.has(guest.id)) {
				await tx.guest.update({ where: { id: guest.id }, data: toGuestData(guest) });
			} else {
				await tx.guest.create({
					data: {
						invitationId,
						...toGuestData(guest),
						attendance: { create: events.map((event) => ({ eventId: event.id })) },
					},
				});
			}
		}

		await tx.invitation.update({
			where: { id: invitationId },
			data: {
				email: input.email,
				locale: input.locale,
				companionAllowance: input.companionAllowance,
			},
		});
	});

	revalidatePath("/admin");
	return { ok: true };
}

export async function deleteInvitation(invitationId: string): Promise<void> {
	await db.invitation.delete({ where: { id: invitationId } });
	revalidatePath("/admin");
	redirect("/admin");
}
