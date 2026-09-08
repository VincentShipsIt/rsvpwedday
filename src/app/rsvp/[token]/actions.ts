"use server";
import { revalidatePath } from "next/cache";
import { canRespond } from "@/domain/invitation";
import { isRsvpPermitted } from "@/domain/rsvp-permissions";
import { createRsvpSubmissionSchema } from "@/domain/rsvp-schema";
import { notDeleted } from "@/domain/soft-delete";
import { Attendance, EmailKind, GuestKind } from "@/generated/prisma/enums";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/locales";
import { db } from "@/lib/db";
import { sendInvitationEmail } from "@/lib/email";
import type { FormActionResult } from "@/lib/form-action";

export async function updateInvitationLocale(token: string, formData: FormData): Promise<void> {
	const locale = formData.get("locale");
	if (typeof locale !== "string" || !isLocale(locale)) return;
	await db.invitation.updateMany({ where: { token }, data: { locale } });
	revalidatePath(`/rsvp/${token}`);
}
export async function submitRsvp(token: string, payload: unknown): Promise<FormActionResult> {
	let savedId: string;
	let failureMessage = getDictionary("en").rsvp.saveError;
	try {
		const result = await db.$transaction(
			async (tx) => {
				const invitation = await tx.invitation.findUnique({
					where: { token },
					include: { guests: { where: notDeleted, include: { attendance: true } } },
				});
				if (!invitation) return { ok: false as const, error: "Invitation not found" };
				const copy = getDictionary(invitation.locale).rsvp;
				failureMessage = copy.saveError;
				const settings = await tx.settings.findUniqueOrThrow({ where: { id: 1 } });
				if (!canRespond(new Date(), settings.rsvpDeadline))
					return { ok: false as const, error: copy.closedError };
				const parsed = createRsvpSubmissionSchema(invitation.companionAllowance).safeParse(payload);
				if (!parsed.success) return { ok: false as const, error: copy.invalidResponseError };
				const submission = parsed.data;
				if (!isRsvpPermitted(invitation.guests, submission))
					return { ok: false as const, error: copy.changedInvitationError };
				for (const response of submission.guests) {
					await tx.guest.update({
						where: { id: response.guestId },
						data: { dietary: response.dietary },
					});
					for (const row of response.attendance) {
						await tx.eventAttendance.update({
							where: { guestId_eventId: { guestId: response.guestId, eventId: row.eventId } },
							data: { status: row.attending ? Attendance.ACCEPTED : Attendance.DECLINED },
						});
					}
				}
				const eventIds = [
					...new Set(
						invitation.guests.flatMap((guest) => guest.attendance.map((row) => row.eventId))
					),
				];
				const accepted = new Set(
					submission.guests.flatMap((guest) =>
						guest.attendance.filter((row) => row.attending).map((row) => row.eventId)
					)
				);
				const retained = submission.companions.flatMap((companion) =>
					companion.id ? [companion.id] : []
				);
				await tx.guest.deleteMany({
					where: {
						invitationId: invitation.id,
						addedByGuest: true,
						kind: GuestKind.ADULT,
						id: { notIn: retained },
					},
				});
				for (const companion of submission.companions) {
					const data = {
						firstName: companion.firstName,
						lastName: companion.lastName,
						kind: GuestKind.ADULT,
						email: companion.email ?? null,
						phone: companion.phone ?? null,
					};
					const guest = companion.id
						? await tx.guest.update({ where: { id: companion.id }, data })
						: await tx.guest.create({
								data: { ...data, invitationId: invitation.id, addedByGuest: true },
							});
					const answers =
						companion.attendance ??
						eventIds.map((eventId) => ({ eventId, attending: accepted.has(eventId) }));
					await tx.eventAttendance.deleteMany({
						where: { guestId: guest.id, eventId: { notIn: eventIds } },
					});
					for (const row of answers) {
						const status = row.attending ? Attendance.ACCEPTED : Attendance.DECLINED;
						await tx.eventAttendance.upsert({
							where: { guestId_eventId: { guestId: guest.id, eventId: row.eventId } },
							create: { guestId: guest.id, eventId: row.eventId, status },
							update: { status },
						});
					}
				}
				await tx.invitationChildAttendance.deleteMany({ where: { invitationId: invitation.id } });
				if (submission.childAttendance.length)
					await tx.invitationChildAttendance.createMany({
						data: submission.childAttendance.map((row) => ({
							invitationId: invitation.id,
							...row,
						})),
					});
				await tx.invitation.update({
					where: { id: invitation.id },
					data: {
						note: submission.note,
						songRequest: submission.songRequest,
						childrenUnder12: submission.childrenUnder12,
						childrenDietary: submission.childrenDietary,
						respondedAt: new Date(),
					},
				});
				return { ok: true as const, id: invitation.id };
			},
			{ isolationLevel: "Serializable" }
		);
		if (!result.ok) return result;
		savedId = result.id;
	} catch (error) {
		console.error("RSVP save failed", error);
		return { ok: false, error: failureMessage };
	}
	try {
		await sendInvitationEmail(EmailKind.CONFIRMATION, savedId);
	} catch (error) {
		console.error("confirmation email failed", error);
	}
	revalidatePath(`/rsvp/${token}`);
	revalidatePath("/admin", "layout");
	return { ok: true };
}
