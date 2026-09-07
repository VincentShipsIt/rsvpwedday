import { headingDefaults, initialHeadings } from "@/app/admin/website/section-headings";
import { StoryForm } from "@/app/admin/website/story/story-form";
import { WebsiteNav } from "@/app/admin/website/website-nav";
import { localeCodes } from "@/i18n/locales";
import { isBlobConfigured } from "@/lib/blob";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StoryPage() {
	const [siteContent, milestones] = await Promise.all([
		db.siteContent.findUnique({ where: { id: 1 }, include: { translations: true } }),
		db.storyMilestone.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
	]);

	return (
		<div className="flex flex-col gap-6">
			<WebsiteNav current="/admin/website/story" />
			<h1 className="text-2xl font-medium">Story</h1>
			<StoryForm
				initialHeadings={initialHeadings(siteContent?.translations, "storyHeading")}
				headingDefaults={headingDefaults("storyHeading")}
				initialTranslations={localeCodes.map((code) => ({
					locale: code,
					storyIntro:
						siteContent?.translations.find((translation) => translation.locale === code)
							?.storyIntro ?? "",
				}))}
				initialMilestones={milestones.map((milestone) => ({
					id: milestone.id,
					sortOrder: milestone.sortOrder,
					dateLabel: milestone.dateLabel,
					imageUrl: milestone.imageUrl ?? "",
					translations: localeCodes.map((code) => {
						const translation = milestone.translations.find(
							(candidate) => candidate.locale === code
						);
						return {
							locale: code,
							title: translation?.title ?? "",
							body: translation?.body ?? "",
						};
					}),
				}))}
				blobConfigured={isBlobConfigured()}
			/>
		</div>
	);
}
