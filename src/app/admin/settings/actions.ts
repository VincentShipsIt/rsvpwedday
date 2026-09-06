"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";

export type EventTranslationInput = {
	locale: Locale;
	name: string;
	description: string;
};

export type EventInput = {
	id?: string;
	slug: string;
	startsAt: string;
	endsAt: string;
	venue: string;
	address: string;
	mapsUrl: string;
	dressCode: string;
	sortOrder: number;
	translations: EventTranslationInput[];
};

export type SettingsInput = {
	coupleNames: string;
	rsvpDeadline: string;
	replyTo: string;
	events: EventInput[];
};

export async function updateSettings(input: SettingsInput): Promise<FormActionResult> {
	if (!input.coupleNames || !input.rsvpDeadline) {
		return { ok: false, error: "Couple names and RSVP deadline are required" };
	}

	const existingEvents = await db.event.findMany({ select: { id: true } });
	const existingEventIds = new Set(existingEvents.map((event) => event.id));
	const submittedEventIds = new Set(
		input.events.filter((event) => event.id).map((event) => event.id)
	);

	await db.$transaction(async (tx) => {
		await tx.settings.upsert({
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

		for (const eventId of existingEventIds) {
			if (!submittedEventIds.has(eventId)) {
				await tx.event.delete({ where: { id: eventId } });
			}
		}

		for (const event of input.events) {
			const eventData = {
				slug: event.slug,
				startsAt: new Date(event.startsAt),
				endsAt: event.endsAt ? new Date(event.endsAt) : null,
				venue: event.venue,
				address: event.address,
				mapsUrl: event.mapsUrl || null,
				dressCode: event.dressCode || null,
				sortOrder: event.sortOrder,
			};

			if (event.id && existingEventIds.has(event.id)) {
				await tx.event.update({ where: { id: event.id }, data: eventData });
				for (const translation of event.translations) {
					await tx.eventTranslation.upsert({
						where: { eventId_locale: { eventId: event.id, locale: translation.locale } },
						create: {
							eventId: event.id,
							locale: translation.locale,
							name: translation.name,
							description: translation.description || null,
						},
						update: {
							name: translation.name,
							description: translation.description || null,
						},
					});
				}
			} else {
				await tx.event.create({
					data: {
						...eventData,
						translations: {
							create: event.translations.map((translation) => ({
								locale: translation.locale,
								name: translation.name,
								description: translation.description || null,
							})),
						},
					},
				});
			}
		}
	});

	revalidatePath("/admin");
	revalidatePath("/admin/settings");
	redirect("/admin/settings");
}
