"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";

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
	translations: SiteContentTranslationInput[];
	milestones: StoryMilestoneInput[];
};

export async function updateSiteContent(input: SiteContentInput): Promise<FormActionResult> {
	const existingMilestones = await db.storyMilestone.findMany({ select: { id: true } });
	const existingMilestoneIds = new Set(existingMilestones.map((milestone) => milestone.id));
	const submittedMilestoneIds = new Set(
		input.milestones.filter((milestone) => milestone.id).map((milestone) => milestone.id)
	);

	await db.$transaction(async (tx) => {
		await tx.siteContent.upsert({
			where: { id: 1 },
			create: {
				id: 1,
				heroImageUrl: input.heroImageUrl || null,
				galleryUrls: input.galleryUrls,
			},
			update: {
				heroImageUrl: input.heroImageUrl || null,
				galleryUrls: input.galleryUrls,
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

		for (const milestone of input.milestones) {
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
	redirect("/admin/website");
}
