"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type EffectsSettings, effectsLimits } from "@/domain/effects-settings";
import { isAllowedImageUrl } from "@/domain/image-url";
import { isAllowedMediaUrl } from "@/domain/media-url";
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
	revalidatePath("/admin/website");
	revalidatePath(path);
	revalidatePath("/");
}

// ---- Hero (heroImageUrl + per-locale tagline) ----

export type HeroTranslationInput = { locale: Locale; tagline: string };
export type HeroInput = { heroImageUrl: string; translations: HeroTranslationInput[] };

export async function updateHero(input: HeroInput): Promise<FormActionResult> {
	if (!imageUrlSchema.safeParse(input.heroImageUrl).success) {
		return invalidImageUrlResult("hero image");
	}

	await db.$transaction(async (tx) => {
		await tx.siteContent.upsert({
			where: { id: 1 },
			create: { id: 1, heroImageUrl: input.heroImageUrl || null },
			update: { heroImageUrl: input.heroImageUrl || null },
		});

		for (const translation of input.translations) {
			await tx.siteContentTranslation.upsert({
				where: { siteContentId_locale: { siteContentId: 1, locale: translation.locale } },
				create: { siteContentId: 1, locale: translation.locale, tagline: translation.tagline },
				update: { tagline: translation.tagline },
			});
		}
	});

	revalidateWebsite("/admin/website/hero");
	return { ok: true };
}

// ---- Story (per-locale storyIntro + milestones) ----

export type StoryIntroTranslationInput = { locale: Locale; storyIntro: string };
export type StoryMilestoneTranslationInput = { locale: Locale; title: string; body: string };
export type StoryMilestoneInput = {
	id?: string;
	sortOrder: number;
	dateLabel: string;
	imageUrl: string;
	translations: StoryMilestoneTranslationInput[];
};
export type StoryInput = {
	translations: StoryIntroTranslationInput[];
	milestones: StoryMilestoneInput[];
};

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
		await tx.siteContent.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });

		for (const translation of input.translations) {
			await tx.siteContentTranslation.upsert({
				where: { siteContentId_locale: { siteContentId: 1, locale: translation.locale } },
				create: {
					siteContentId: 1,
					locale: translation.locale,
					storyIntro: translation.storyIntro,
				},
				update: { storyIntro: translation.storyIntro },
			});
		}

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
							body: translation.body,
						},
						update: {
							title: translation.title,
							body: translation.body,
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
								body: translation.body,
							})),
						},
					},
				});
			}
		}
	});

	revalidateWebsite("/admin/website/story");
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
	translations: EventTranslationInput[];
};
export type EventsInput = { events: EventInput[] };

export async function updateEvents(input: EventsInput): Promise<FormActionResult> {
	const existingEvents = await db.event.findMany({ select: { id: true } });
	const existingEventIds = new Set(existingEvents.map((event) => event.id));
	const submittedEventIds = new Set(
		input.events.filter((event) => event.id).map((event) => event.id)
	);

	await db.$transaction(async (tx) => {
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
	revalidateWebsite("/admin/website/events");
	return { ok: true };
}

// ---- Gallery (galleryUrls) ----

export type GalleryInput = { galleryUrls: string[] };

export async function updateGallery(input: GalleryInput): Promise<FormActionResult> {
	for (const [index, url] of input.galleryUrls.entries()) {
		if (!imageUrlSchema.safeParse(url).success) {
			return invalidImageUrlResult(`gallery image #${index + 1}`);
		}
	}

	await db.siteContent.upsert({
		where: { id: 1 },
		create: { id: 1, galleryUrls: input.galleryUrls },
		update: { galleryUrls: input.galleryUrls },
	});

	revalidateWebsite("/admin/website/gallery");
	return { ok: true };
}

// ---- RSVP (per-locale rsvpNote) ----

export type RsvpTranslationInput = { locale: Locale; rsvpNote: string };
export type RsvpInput = { translations: RsvpTranslationInput[] };

export async function updateRsvpNote(input: RsvpInput): Promise<FormActionResult> {
	await db.$transaction(async (tx) => {
		await tx.siteContent.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });

		for (const translation of input.translations) {
			await tx.siteContentTranslation.upsert({
				where: { siteContentId_locale: { siteContentId: 1, locale: translation.locale } },
				create: { siteContentId: 1, locale: translation.locale, rsvpNote: translation.rsvpNote },
				update: { rsvpNote: translation.rsvpNote },
			});
		}
	});

	revalidateWebsite("/admin/website/rsvp");
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

	revalidateWebsite("/admin/website/theme");
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

	revalidateWebsite("/admin/website/effects");
	return { ok: true };
}
