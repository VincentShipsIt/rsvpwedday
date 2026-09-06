"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseImportCsv } from "@/domain/csv";
import { newToken } from "@/domain/token";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";

export async function commitImport(text: string): Promise<FormActionResult> {
	const { invitations, errors } = parseImportCsv(text);
	if (errors.length > 0) {
		return { ok: false, error: errors[0] ?? "Invalid CSV" };
	}
	if (invitations.length === 0) {
		return { ok: false, error: "No rows to import" };
	}

	const events = await db.event.findMany({ select: { id: true } });

	await db.$transaction(async (tx) => {
		for (const invitation of invitations) {
			const guestsData = invitation.guests.map((guest) => ({
				firstName: guest.firstName,
				lastName: guest.lastName,
				kind: guest.kind,
				email: guest.email,
				phone: guest.phone,
				attendance: { create: events.map((event) => ({ eventId: event.id })) },
			}));

			const existing = await tx.invitation.findUnique({ where: { email: invitation.email } });

			if (existing) {
				await tx.guest.deleteMany({
					where: { invitationId: existing.id, addedByGuest: false },
				});
				await tx.invitation.update({
					where: { id: existing.id },
					data: {
						locale: invitation.locale,
						companionAllowance: invitation.companionAllowance,
						guests: { create: guestsData },
					},
				});
			} else {
				await tx.invitation.create({
					data: {
						email: invitation.email,
						locale: invitation.locale,
						companionAllowance: invitation.companionAllowance,
						token: newToken(),
						guests: { create: guestsData },
					},
				});
			}
		}
	});

	revalidatePath("/admin");
	revalidatePath("/admin/guests");
	redirect("/admin");
}
