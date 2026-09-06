"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";

export type SettingsInput = {
	coupleNames: string;
	rsvpDeadline: string;
	replyTo: string;
};

export async function updateSettings(input: SettingsInput): Promise<FormActionResult> {
	if (!input.coupleNames || !input.rsvpDeadline) {
		return { ok: false, error: "Couple names and RSVP deadline are required" };
	}

	await db.settings.upsert({
		where: { id: 1 },
		create: {
			id: 1,
			coupleNames: input.coupleNames,
			rsvpDeadline: new Date(input.rsvpDeadline),
			replyTo: input.replyTo || null,
		},
		update: {
			coupleNames: input.coupleNames,
			rsvpDeadline: new Date(input.rsvpDeadline),
			replyTo: input.replyTo || null,
		},
	});

	revalidatePath("/admin");
	revalidatePath("/admin/settings");
	return { ok: true };
}
