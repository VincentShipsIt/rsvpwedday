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

export type SectionHeadingInput = { locale: Locale; heading: string };
type HeadingField = "storyHeading" | "eventsHeading" | "galleryHeading" | "rsvpHeading";

// Per-locale section heading upsert shared by the story, events, gallery and RSVP actions.
async function upsertHeadings(
	tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
	field: HeadingField,
	headings: SectionHeadingInput[] | undefined
) {
	for (const heading of headings ?? []) {
		const value = heading.heading.trim();
		await tx.siteContentTranslation.upsert({
			where: { siteContentId_locale: { siteContentId: 1, locale: heading.locale } },
			create: { siteContentId: 1, locale: heading.locale, [field]: value },
			update: { [field]: value },
		});
	}
}

function revalidateWebsite(path: string) {
	revalidatePath("/admin/website");
	revalidatePath(path);
	revalidatePath("/");
	revalidatePath("/guide");
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
	headings?: SectionHeadingInput[];
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
					storyIntro: sanitizeRichText(translation.storyIntro),
				},
				update: { storyIntro: sanitizeRichText(translation.storyIntro) },
			});
		}
		await upsertHeadings(tx, "storyHeading", input.headings);

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
export type EventsInput = { events: EventInput[]; headings?: SectionHeadingInput[] };

export async function updateEvents(input: EventsInput): Promise<FormActionResult> {
	const existingEvents = await db.event.findMany({ select: { id: true } });
	const existingEventIds = new Set(existingEvents.map((event) => event.id));
	const submittedEventIds = new Set(
		input.events.filter((event) => event.id).map((event) => event.id)
	);

	await db.$transaction(async (tx) => {
		await tx.siteContent.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
		await upsertHeadings(tx, "eventsHeading", input.headings);

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
	revalidateWebsite("/admin/website/events");
	return { ok: true };
}

// ---- Gallery (galleryUrls) ----

export type GalleryInput = { galleryUrls: string[]; headings?: SectionHeadingInput[] };

export async function updateGallery(input: GalleryInput): Promise<FormActionResult> {
	for (const [index, url] of input.galleryUrls.entries()) {
		if (!imageUrlSchema.safeParse(url).success) {
			return invalidImageUrlResult(`gallery image #${index + 1}`);
		}
	}

	await db.$transaction(async (tx) => {
		await tx.siteContent.upsert({
			where: { id: 1 },
			create: { id: 1, galleryUrls: input.galleryUrls },
			update: { galleryUrls: input.galleryUrls },
		});
		await upsertHeadings(tx, "galleryHeading", input.headings);
	});

	revalidateWebsite("/admin/website/gallery");
	return { ok: true };
}

// ---- RSVP (per-locale rsvpNote) ----

export type RsvpTranslationInput = { locale: Locale; rsvpNote: string };
export type RsvpInput = { translations: RsvpTranslationInput[]; headings?: SectionHeadingInput[] };

export async function updateRsvpNote(input: RsvpInput): Promise<FormActionResult> {
	await db.$transaction(async (tx) => {
		await tx.siteContent.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });

		for (const translation of input.translations) {
			await tx.siteContentTranslation.upsert({
				where: { siteContentId_locale: { siteContentId: 1, locale: translation.locale } },
				create: {
					siteContentId: 1,
					locale: translation.locale,
					rsvpNote: sanitizeRichText(translation.rsvpNote),
				},
				update: { rsvpNote: sanitizeRichText(translation.rsvpNote) },
			});
		}
		await upsertHeadings(tx, "rsvpHeading", input.headings);
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

// ---- Guide (per-locale guideTitle/guideIntro + sections with their items) ----

// Optional outbound link on a guide item (a hotel, an airline). Empty is allowed; anything else
// has to be an absolute http(s) URL so a guest never lands on a broken or `javascript:` href.
const linkUrlSchema = z.union([z.literal(""), z.url({ protocol: /^https?$/ })]);

export type GuideIntroTranslationInput = { locale: Locale; guideTitle: string; guideIntro: string };
export type GuideSectionTranslationInput = { locale: Locale; title: string; intro: string };
export type GuideItemTranslationInput = { locale: Locale; title: string; body: string };
export type GuideItemInput = {
	id?: string;
	sortOrder: number;
	url: string;
	imageUrl: string;
	translations: GuideItemTranslationInput[];
};
export type GuideSectionInput = {
	id?: string;
	slug: string;
	sortOrder: number;
	imageUrl: string;
	translations: GuideSectionTranslationInput[];
	items: GuideItemInput[];
};
export type GuideInput = {
	translations: GuideIntroTranslationInput[];
	sections: GuideSectionInput[];
};

// The anchor typed in the admin ("Where to stay") becomes the `#where-to-stay` fragment on
// `/guide`. Falls back to the section's English title, then its position, and de-duplicates so
// two sections can never fight over one anchor and trip the unique index.
function normalizeGuideSlugs(sections: GuideSectionInput[]): string[] {
	const used = new Set<string>();
	return sections.map((section, index) => {
		const englishTitle = section.translations.find((t) => t.locale === "en")?.title ?? "";
		const base =
			(section.slug || englishTitle)
				.toLowerCase()
				.normalize("NFKD")
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "") || `section-${index + 1}`;
		let slug = base;
		let suffix = 2;
		while (used.has(slug)) {
			slug = `${base}-${suffix}`;
			suffix += 1;
		}
		used.add(slug);
		return slug;
	});
}

export async function updateGuide(input: GuideInput): Promise<FormActionResult> {
	for (const [sectionIndex, section] of input.sections.entries()) {
		if (!imageUrlSchema.safeParse(section.imageUrl).success) {
			return invalidImageUrlResult(`guide section #${sectionIndex + 1} image`);
		}
		for (const [itemIndex, item] of section.items.entries()) {
			if (!imageUrlSchema.safeParse(item.imageUrl).success) {
				return invalidImageUrlResult(
					`guide section #${sectionIndex + 1}, item #${itemIndex + 1} image`
				);
			}
			if (!linkUrlSchema.safeParse(item.url).success) {
				return {
					ok: false,
					error: `Enter a full http(s) link for guide section #${sectionIndex + 1}, item #${itemIndex + 1}.`,
				};
			}
		}
	}

	// Same re-derivation as `updateStory`: 0..n-1 from the submitted order, for sections and for
	// the items inside each one.
	const normalizedSections = [...input.sections]
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.map((section, index) => ({
			...section,
			sortOrder: index,
			items: [...section.items]
				.sort((a, b) => a.sortOrder - b.sortOrder)
				.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex })),
		}));
	const slugs = normalizeGuideSlugs(normalizedSections);

	const existingSections = await db.guideSection.findMany({
		select: { id: true, items: { select: { id: true } } },
	});
	const existingSectionIds = new Set(existingSections.map((section) => section.id));
	const existingItemIds = new Set(
		existingSections.flatMap((section) => section.items.map((item) => item.id))
	);
	const submittedSectionIds = new Set(
		normalizedSections.filter((section) => section.id).map((section) => section.id)
	);
	const submittedItemIds = new Set(
		normalizedSections.flatMap((section) =>
			section.items.filter((item) => item.id).map((item) => item.id)
		)
	);

	await db.$transaction(async (tx) => {
		await tx.siteContent.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });

		for (const translation of input.translations) {
			await tx.siteContentTranslation.upsert({
				where: { siteContentId_locale: { siteContentId: 1, locale: translation.locale } },
				create: {
					siteContentId: 1,
					locale: translation.locale,
					guideTitle: translation.guideTitle,
					guideIntro: translation.guideIntro,
				},
				update: { guideTitle: translation.guideTitle, guideIntro: translation.guideIntro },
			});
		}

		for (const sectionId of existingSectionIds) {
			if (!submittedSectionIds.has(sectionId)) {
				await tx.guideSection.delete({ where: { id: sectionId } });
			}
		}
		for (const itemId of existingItemIds) {
			if (!submittedItemIds.has(itemId)) {
				await tx.guideItem.deleteMany({ where: { id: itemId } });
			}
		}

		// Two passes over the slugs: a section keeping its own slug while another section takes
		// its old one would otherwise collide mid-transaction on the unique index.
		for (const section of normalizedSections) {
			if (section.id && existingSectionIds.has(section.id)) {
				await tx.guideSection.update({
					where: { id: section.id },
					data: { slug: `pending-${section.id}` },
				});
			}
		}

		for (const [index, section] of normalizedSections.entries()) {
			const sectionData = {
				slug: slugs[index] ?? `section-${index + 1}`,
				sortOrder: section.sortOrder,
				imageUrl: section.imageUrl || null,
			};

			let sectionId: string;
			if (section.id && existingSectionIds.has(section.id)) {
				sectionId = section.id;
				await tx.guideSection.update({ where: { id: sectionId }, data: sectionData });
				for (const translation of section.translations) {
					await tx.guideSectionTranslation.upsert({
						where: { sectionId_locale: { sectionId, locale: translation.locale } },
						create: {
							sectionId,
							locale: translation.locale,
							title: translation.title,
							intro: translation.intro,
						},
						update: { title: translation.title, intro: translation.intro },
					});
				}
			} else {
				const created = await tx.guideSection.create({
					data: {
						...sectionData,
						translations: {
							create: section.translations.map((translation) => ({
								locale: translation.locale,
								title: translation.title,
								intro: translation.intro,
							})),
						},
					},
				});
				sectionId = created.id;
			}

			for (const item of section.items) {
				const itemData = {
					sectionId,
					sortOrder: item.sortOrder,
					url: item.url || null,
					imageUrl: item.imageUrl || null,
				};

				if (item.id && existingItemIds.has(item.id)) {
					await tx.guideItem.update({ where: { id: item.id }, data: itemData });
					for (const translation of item.translations) {
						await tx.guideItemTranslation.upsert({
							where: { itemId_locale: { itemId: item.id, locale: translation.locale } },
							create: {
								itemId: item.id,
								locale: translation.locale,
								title: translation.title,
								body: translation.body,
							},
							update: { title: translation.title, body: translation.body },
						});
					}
				} else {
					await tx.guideItem.create({
						data: {
							...itemData,
							translations: {
								create: item.translations.map((translation) => ({
									locale: translation.locale,
									title: translation.title,
									body: translation.body,
								})),
							},
						},
					});
				}
			}
		}
	});

	revalidateWebsite("/admin/website/guide");
	return { ok: true };
}

// ---- FAQ (entries with per-locale question/answer) ----

export type FaqEntryTranslationInput = { locale: Locale; question: string; answer: string };
export type FaqEntryInput = {
	id?: string;
	sortOrder: number;
	translations: FaqEntryTranslationInput[];
};
export type FaqInput = { entries: FaqEntryInput[] };

export async function updateFaq(input: FaqInput): Promise<FormActionResult> {
	const normalizedEntries = [...input.entries]
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.map((entry, index) => ({ ...entry, sortOrder: index }));

	const existingEntries = await db.faqEntry.findMany({ select: { id: true } });
	const existingEntryIds = new Set(existingEntries.map((entry) => entry.id));
	const submittedEntryIds = new Set(
		normalizedEntries.filter((entry) => entry.id).map((entry) => entry.id)
	);

	await db.$transaction(async (tx) => {
		for (const entryId of existingEntryIds) {
			if (!submittedEntryIds.has(entryId)) {
				await tx.faqEntry.delete({ where: { id: entryId } });
			}
		}

		for (const entry of normalizedEntries) {
			if (entry.id && existingEntryIds.has(entry.id)) {
				await tx.faqEntry.update({ where: { id: entry.id }, data: { sortOrder: entry.sortOrder } });
				for (const translation of entry.translations) {
					await tx.faqEntryTranslation.upsert({
						where: { entryId_locale: { entryId: entry.id, locale: translation.locale } },
						create: {
							entryId: entry.id,
							locale: translation.locale,
							question: translation.question,
							answer: translation.answer,
						},
						update: { question: translation.question, answer: translation.answer },
					});
				}
			} else {
				await tx.faqEntry.create({
					data: {
						sortOrder: entry.sortOrder,
						translations: {
							create: entry.translations.map((translation) => ({
								locale: translation.locale,
								question: translation.question,
								answer: translation.answer,
							})),
						},
					},
				});
			}
		}
	});

	revalidateWebsite("/admin/website/faq");
	return { ok: true };
}
