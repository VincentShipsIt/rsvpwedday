"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";
import { requireAdmin } from "@/lib/require-admin";
import { isTimeZone, parseWireDatePreserving } from "@/lib/wire-date";

export type SettingsInput = {
	coupleNames: string;
	timeZone: string;
	/** A `yyyy-MM-ddTHH:mm` string; empty means the couple has not set the day yet. */
	weddingDate: string;
	rsvpDeadline: string;
	replyTo: string;
};

export async function updateSettings(input: SettingsInput): Promise<FormActionResult> {
	await requireAdmin();
	if (!input.coupleNames || !input.rsvpDeadline) {
		return { ok: false, error: "Couple names and RSVP deadline are required" };
	}

	if (!isTimeZone(input.timeZone))
		return { ok: false, error: "Enter a valid IANA timezone, for example Europe/Berlin." };
	// Changing the display timezone must not move existing instants. The form re-formats its
	// wall times on a zone change, so normal edits still parse in the newly selected zone.
	const previous = await db.settings.findUnique({ where: { id: 1 } });
	const weddingDate = parseWireDatePreserving(
		input.weddingDate,
		input.timeZone,
		previous?.weddingDate
	);
	const rsvpDeadline = parseWireDatePreserving(
		input.rsvpDeadline,
		input.timeZone,
		previous?.rsvpDeadline
	);
	if (!rsvpDeadline)
		return {
			ok: false,
			error: "Enter a valid RSVP deadline. Times skipped by daylight saving are not valid.",
		};
	if (input.weddingDate && weddingDate === null) {
		return { ok: false, error: "Enter a valid wedding date" };
	}

	await db.settings.upsert({
		where: { id: 1 },
		create: {
			id: 1,
			coupleNames: input.coupleNames,
			weddingDate,
			rsvpDeadline,
			timeZone: input.timeZone,
			replyTo: input.replyTo || null,
		},
		update: {
			coupleNames: input.coupleNames,
			weddingDate,
			rsvpDeadline,
			timeZone: input.timeZone,
			replyTo: input.replyTo || null,
		},
	});

	revalidatePath("/admin");
	revalidatePath("/admin/settings");
	revalidatePath("/admin/memories");
	// The countdown reads it, and it sits on whichever page carries the hero block.
	revalidatePath("/", "layout");
	return { ok: true };
}
