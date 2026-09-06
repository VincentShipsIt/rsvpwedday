"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAllowedImageUrl } from "@/domain/image-url";
import type { Locale, SiteTheme } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";

const imageUrlSchema = z.string().refine((value) => value === "" || isAllowedImageUrl(value), {
	message: "must be a valid https image URL",
});

export type SiteContentTranslationInput = {
	locale: Locale;
	tagline: string;
	storyIntro: string;
	rsvpNote: string;
};

export type StoryMilestoneTranslationInput = {
	locale: Locale;
	title: string;
	body: string;
};

export type StoryMilestoneInput = {
	id?: string;
	sortOrder: number;
	dateLabel: string;
	imageUrl: string;
	translations: StoryMilestoneTranslationInput[];
};

export type SiteContentInput = {
	heroImageUrl: string;
	galleryUrls: string[];
	theme: SiteTheme;
	translations: SiteContentTranslationInput[];
	milestones: StoryMilestoneInput[];
};

function findFirstInvalidImageUrlField(input: SiteContentInput): string | null {
	if (!imageUrlSchema.safeParse(input.heroImageUrl).success) {
		return "hero image";
	}

	for (const [index, url] of input.galleryUrls.entries()) {
		if (!imageUrlSchema.safeParse(url).success) {
			return `gallery image #${index + 1}`;
		}
	}

	for (const [index, milestone] of input.milestones.entries()) {
		if (!imageUrlSchema.safeParse(milestone.imageUrl).success) {
			return `milestone #${index + 1} image`;
		}
	}

	return null;
}

export async function updateSiteContent(input: SiteContentInput): Promise<FormActionResult> {
	const invalidImageField = findFirstInvalidImageUrlField(input);
	if (invalidImageField) {
		return { ok: false, error: `Enter a valid https image URL for the ${invalidImageField}.` };
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
		await tx.siteContent.upsert({
			where: { id: 1 },
			create: {
				id: 1,
				heroImageUrl: input.heroImageUrl || null,
				galleryUrls: input.galleryUrls,
				theme: input.theme,
			},
			update: {
				heroImageUrl: input.heroImageUrl || null,
				galleryUrls: input.galleryUrls,
				theme: input.theme,
			},
		});

		for (const translation of input.translations) {
			await tx.siteContentTranslation.upsert({
				where: { siteContentId_locale: { siteContentId: 1, locale: translation.locale } },
				create: {
					siteContentId: 1,
					locale: translation.locale,
					tagline: translation.tagline,
					storyIntro: translation.storyIntro,
					rsvpNote: translation.rsvpNote,
				},
				update: {
					tagline: translation.tagline,
					storyIntro: translation.storyIntro,
					rsvpNote: translation.rsvpNote,
				},
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

	revalidatePath("/admin");
	revalidatePath("/admin/website");
	revalidatePath("/");
	return { ok: true };
}
