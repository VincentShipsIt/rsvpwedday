import { WebsiteForm } from "@/app/admin/website/website-form";
import { SiteTheme } from "@/generated/prisma/enums";
import { localeCodes } from "@/i18n/locales";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WebsitePage() {
	const [siteContent, milestones] = await Promise.all([
		db.siteContent.findUnique({ where: { id: 1 }, include: { translations: true } }),
		db.storyMilestone.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
	]);

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-medium">Website</h1>
			<WebsiteForm
				initialHeroImageUrl={siteContent?.heroImageUrl ?? ""}
				initialGalleryUrls={(siteContent?.galleryUrls ?? []).join("\n")}
				initialTheme={siteContent?.theme ?? SiteTheme.EDITORIAL}
				initialTranslations={localeCodes.map((code) => {
					const translation = siteContent?.translations.find(
						(candidate) => candidate.locale === code
					);
					return {
						locale: code,
						tagline: translation?.tagline ?? "",
						storyIntro: translation?.storyIntro ?? "",
						rsvpNote: translation?.rsvpNote ?? "",
					};
				})}
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
			/>
		</div>
	);
}
