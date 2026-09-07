"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";
import { parseWireDate } from "@/lib/wire-date";

export type SettingsInput = {
	coupleNames: string;
	/** A `yyyy-MM-ddTHH:mm` string; empty means the couple has not set the day yet. */
	weddingDate: string;
	rsvpDeadline: string;
	replyTo: string;
};

export async function updateSettings(input: SettingsInput): Promise<FormActionResult> {
	if (!input.coupleNames || !input.rsvpDeadline) {
		return { ok: false, error: "Couple names and RSVP deadline are required" };
	}

	const weddingDate = parseWireDate(input.weddingDate);
	if (input.weddingDate && weddingDate === null) {
		return { ok: false, error: "Enter a valid wedding date" };
	}

	await db.settings.upsert({
		where: { id: 1 },
		create: {
			id: 1,
			coupleNames: input.coupleNames,
			weddingDate,
			rsvpDeadline: new Date(input.rsvpDeadline),
			replyTo: input.replyTo || null,
		},
		update: {
			coupleNames: input.coupleNames,
			weddingDate,
			rsvpDeadline: new Date(input.rsvpDeadline),
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
