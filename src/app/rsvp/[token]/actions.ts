"use server";

import { revalidatePath } from "next/cache";
import { canRespond } from "@/domain/invitation";
import { createRsvpSubmissionSchema } from "@/domain/rsvp-schema";
import { Attendance, EmailKind } from "@/generated/prisma/client";
import { isLocale } from "@/i18n/locales";
import { db } from "@/lib/db";
import { sendInvitationEmail } from "@/lib/email";
import type { FormActionResult } from "@/lib/form-action";

export async function updateInvitationLocale(token: string, formData: FormData): Promise<void> {
	const locale = formData.get("locale");
	if (typeof locale !== "string" || !isLocale(locale)) {
		return;
	}

	await db.invitation.update({ where: { token }, data: { locale } });
	revalidatePath(`/rsvp/${token}`);
}

export async function submitRsvp(token: string, payload: unknown): Promise<FormActionResult> {
	const invitation = await db.invitation.findUnique({
		where: { token },
		include: { guests: true },
	});
	if (!invitation) {
		return { ok: false, error: "Invitation not found" };
	}

	const settings = await db.settings.findUniqueOrThrow({ where: { id: 1 } });
	if (!canRespond(new Date(), settings.rsvpDeadline)) {
		return { ok: false, error: "The RSVP deadline has passed" };
	}

	const schema = createRsvpSubmissionSchema(invitation.companionAllowance);
	const parsed = schema.safeParse(payload);
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid submission" };
	}

	const submission = parsed.data;
	const guestIds = new Set(invitation.guests.map((guest) => guest.id));
	const isEveryGuestKnown = submission.guests.every((guest) => guestIds.has(guest.guestId));
	if (!isEveryGuestKnown) {
		return { ok: false, error: "Unknown guest in submission" };
	}

	const acceptedEventIds = new Set(
		submission.guests.flatMap((guest) =>
			guest.attendance
				.filter((attendance) => attendance.attending)
				.map((attendance) => attendance.eventId)
		)
	);

	await db.$transaction(async (tx) => {
		for (const guestResponse of submission.guests) {
			await tx.guest.update({
				where: { id: guestResponse.guestId },
				data: { dietary: guestResponse.dietary },
			});

			for (const attendance of guestResponse.attendance) {
				await tx.eventAttendance.upsert({
					where: {
						guestId_eventId: { guestId: guestResponse.guestId, eventId: attendance.eventId },
					},
					create: {
						guestId: guestResponse.guestId,
						eventId: attendance.eventId,
						status: attendance.attending ? Attendance.ACCEPTED : Attendance.DECLINED,
					},
					update: {
						status: attendance.attending ? Attendance.ACCEPTED : Attendance.DECLINED,
					},
				});
			}
		}

		await tx.guest.deleteMany({ where: { invitationId: invitation.id, addedByGuest: true } });

		for (const companion of submission.companions) {
			const companionGuest = await tx.guest.create({
				data: {
					invitationId: invitation.id,
					firstName: companion.firstName,
					lastName: companion.lastName,
					kind: companion.kind,
					email: companion.email ?? null,
					phone: companion.phone ?? null,
					addedByGuest: true,
				},
			});

			for (const eventId of acceptedEventIds) {
				await tx.eventAttendance.create({
					data: { guestId: companionGuest.id, eventId, status: Attendance.ACCEPTED },
				});
			}
		}

		await tx.invitation.update({
			where: { id: invitation.id },
			data: {
				note: submission.note,
				songRequest: submission.songRequest,
				respondedAt: new Date(),
			},
		});
	});

	await sendInvitationEmail(EmailKind.CONFIRMATION, invitation.id);
	revalidatePath(`/rsvp/${token}`);

	return { ok: true };
}
