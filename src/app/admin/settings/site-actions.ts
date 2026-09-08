"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type EffectsSettings, effectsLimits } from "@/domain/effects-settings";
import { isAllowedImageUrl } from "@/domain/image-url";
import { isAllowedMediaUrl } from "@/domain/media-url";
import { sanitizeRichText } from "@/domain/rich-text";
import type { Locale, OpeningAnimation, SiteTheme } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";

// Shared validation boundary for every image URL field across the split website sections below.
const imageUrlSchema = z.string().refine((value) => value === "" || isAllowedImageUrl(value), {
	message: "must be a valid https image URL",
});

function invalidImageUrlResult(label: string): FormActionResult {
	return { ok: false, error: `Enter a valid https image URL for the ${label}.` };
}

function revalidateWebsite(path: string) {
	revalidatePath("/admin/settings");
	revalidatePath(path);
	// Blocks render this data on whichever pages carry them, so every public page is stale.
	revalidatePath("/", "layout");
}

// ---- Story milestones ----

export type StoryMilestoneTranslationInput = { locale: Locale; title: string; body: string };
export type StoryMilestoneInput = {
	id?: string;
	sortOrder: number;
	dateLabel: string;
	imageUrl: string;
	translations: StoryMilestoneTranslationInput[];
};
export type StoryInput = { milestones: StoryMilestoneInput[] };

export async function updateStory(input: StoryInput): Promise<FormActionResult> {
	for (const [index, milestone] of input.milestones.entries()) {
		if (!imageUrlSchema.safeParse(milestone.imageUrl).success) {
			return invalidImageUrlResult(`milestone #${index + 1} image`);
		}
	}

	// Duplicate `sortOrder` values could otherwise persist across saves (e.g. two milestones both
	// added client-side before a save), so every save re-derives 0..n-1 from the submitted order.
	const normalizedMilestones = [...input.milestones]
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.map((milestone, index) => ({ ...milestone, sortOrder: index }));

	const existingMilestones = await db.storyMilestone.findMany({ select: { id: true } });
	const existingMilestoneIds = new Set(existingMilestones.map((milestone) => milestone.id));
	const submittedMilestoneIds = new Set(
		normalizedMilestones.filter((milestone) => milestone.id).map((milestone) => milestone.id)
	);

	await db.$transaction(async (tx) => {
		for (const milestoneId of existingMilestoneIds) {
			if (!submittedMilestoneIds.has(milestoneId)) {
				await tx.storyMilestone.delete({ where: { id: milestoneId } });
			}
		}

		for (const milestone of normalizedMilestones) {
			const milestoneData = {
				sortOrder: milestone.sortOrder,
				dateLabel: milestone.dateLabel,
				imageUrl: milestone.imageUrl || null,
			};

			if (milestone.id && existingMilestoneIds.has(milestone.id)) {
				await tx.storyMilestone.update({ where: { id: milestone.id }, data: milestoneData });
				for (const translation of milestone.translations) {
					await tx.storyMilestoneTranslation.upsert({
						where: {
							milestoneId_locale: { milestoneId: milestone.id, locale: translation.locale },
						},
						create: {
							milestoneId: milestone.id,
							locale: translation.locale,
							title: translation.title,
							body: sanitizeRichText(translation.body),
						},
						update: {
							title: translation.title,
							body: sanitizeRichText(translation.body),
						},
					});
				}
			} else {
				await tx.storyMilestone.create({
					data: {
						...milestoneData,
						translations: {
							create: milestone.translations.map((translation) => ({
								locale: translation.locale,
								title: translation.title,
								body: sanitizeRichText(translation.body),
							})),
						},
					},
				});
			}
		}
	});

	revalidateWebsite("/admin/settings/milestones");
	return { ok: true };
}

// ---- Events (Event rows + their translations) ----

export type EventTranslationInput = { locale: Locale; name: string; description: string };
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
	showPublicly: boolean;
	translations: EventTranslationInput[];
};
export type EventsInput = { events: EventInput[] };

// A half-filled card autosaves too, so reject incomplete rows here instead of letting Prisma
// throw on an Invalid Date or a duplicate/empty slug (both surfaced as a bare 500 before).
function validateEvents(events: EventInput[]): string | null {
	const seenSlugs = new Set<string>();
	for (const [index, event] of events.entries()) {
		const label = `Event ${index + 1}`;
		const slug = event.slug.trim();
		if (!slug) return `${label} needs a slug.`;
		if (seenSlugs.has(slug)) return `${label} reuses the slug "${slug}"; slugs must be unique.`;
		seenSlugs.add(slug);
		if (!event.startsAt || Number.isNaN(new Date(event.startsAt).getTime())) {
			return `${label} needs a start date and time.`;
		}
		if (event.endsAt && Number.isNaN(new Date(event.endsAt).getTime())) {
			return `${label} has an invalid end date.`;
		}
	}
	return null;
}

export async function updateEvents(input: EventsInput): Promise<FormActionResult> {
	const validationError = validateEvents(input.events);
	if (validationError) return { ok: false, error: validationError };

	const existingEvents = await db.event.findMany({ select: { id: true } });
	const existingEventIds = new Set(existingEvents.map((event) => event.id));
	const submittedEventIds = new Set(
		input.events.filter((event) => event.id).map((event) => event.id)
	);

	await db.$transaction(async (tx) => {
		await tx.siteContent.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });

		for (const eventId of existingEventIds) {
			if (!submittedEventIds.has(eventId)) {
				await tx.event.delete({ where: { id: eventId } });
			}
		}

		for (const event of input.events) {
			const eventData = {
				slug: event.slug.trim(),
				startsAt: new Date(event.startsAt),
				endsAt: event.endsAt ? new Date(event.endsAt) : null,
				venue: event.venue,
				address: event.address,
				mapsUrl: event.mapsUrl || null,
				dressCode: event.dressCode || null,
				sortOrder: event.sortOrder,
				showPublicly: event.showPublicly,
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
							description: sanitizeRichText(translation.description) || null,
						},
						update: {
							name: translation.name,
							description: sanitizeRichText(translation.description) || null,
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
								description: sanitizeRichText(translation.description) || null,
							})),
						},
					},
				});
			}
		}
	});

	revalidatePath("/admin");
	revalidateWebsite("/admin/settings/events");
	return { ok: true };
}

// ---- Theme ----

export type ThemeInput = { theme: SiteTheme };

export async function updateTheme(input: ThemeInput): Promise<FormActionResult> {
	await db.siteContent.upsert({
		where: { id: 1 },
		create: { id: 1, theme: input.theme },
		update: { theme: input.theme },
	});

	revalidateWebsite("/admin/settings/theme");
	return { ok: true };
}

// ---- Effects (opening animation, particles, background music) ----

export type EffectsInput = EffectsSettings & {
	openingAnimation: OpeningAnimation;
	particlesEnabled: boolean;
	musicUrl: string;
};

function settingSchema(key: keyof EffectsSettings) {
	return z.number().int().min(effectsLimits[key].min).max(effectsLimits[key].max);
}

const effectsSettingsSchema = z.object({
	openingHoldSeconds: settingSchema("openingHoldSeconds"),
	openingSpeed: settingSchema("openingSpeed"),
	particleCount: settingSchema("particleCount"),
	particleSeconds: settingSchema("particleSeconds"),
	particleSpeed: settingSchema("particleSpeed"),
	musicVolume: settingSchema("musicVolume"),
});

const audioUrlSchema = z.string().refine((value) => value === "" || isAllowedMediaUrl(value), {
	message: "must be a valid https audio URL",
});

export async function updateEffects(input: EffectsInput): Promise<FormActionResult> {
	if (!audioUrlSchema.safeParse(input.musicUrl).success) {
		return { ok: false, error: "Enter a valid https audio URL for the background music." };
	}

	const settings = effectsSettingsSchema.safeParse(input);
	if (!settings.success) {
		return { ok: false, error: "Every timing and count needs a whole number inside its range." };
	}

	const data = {
		...settings.data,
		openingAnimation: input.openingAnimation,
		particlesEnabled: input.particlesEnabled,
		musicUrl: input.musicUrl || null,
	};

	await db.siteContent.upsert({
		where: { id: 1 },
		create: { id: 1, ...data },
		update: data,
	});

	revalidateWebsite("/admin/settings/effects");
	return { ok: true };
}
