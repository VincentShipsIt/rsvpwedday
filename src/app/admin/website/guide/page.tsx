import { GuideForm } from "@/app/admin/website/guide/guide-form";
import { WebsiteNav } from "@/app/admin/website/website-nav";
import { localeCodes } from "@/i18n/locales";
import { isBlobConfigured } from "@/lib/blob";
import { db } from "@/lib/db";
import { isImageGenerationConfigured } from "@/lib/replicate";

export const dynamic = "force-dynamic";

export default async function GuidePage() {
	const [siteContent, sections] = await Promise.all([
		db.siteContent.findUnique({ where: { id: 1 }, include: { translations: true } }),
		db.guideSection.findMany({
			orderBy: { sortOrder: "asc" },
			include: {
				translations: true,
				items: { orderBy: { sortOrder: "asc" }, include: { translations: true } },
			},
		}),
	]);

	return (
		<div className="flex flex-col gap-6">
			<WebsiteNav current="/admin/website/guide" />
			<h1 className="text-2xl font-medium">Travel guide</h1>
			<p className="max-w-2xl text-sm text-muted-foreground">
				A separate page for guests who don't know the destination. Each section becomes an anchored
				block on <code>/guide</code> (getting there, where to stay, things to see) and each item
				inside it a card, optionally with a link. Leave it empty and the page, the nav link, and the
				home-page teaser all stay hidden.
			</p>
			<GuideForm
				initialTranslations={localeCodes.map((code) => {
					const translation = siteContent?.translations.find(
						(candidate) => candidate.locale === code
					);
					return {
						locale: code,
						guideTitle: translation?.guideTitle ?? "",
						guideIntro: translation?.guideIntro ?? "",
					};
				})}
				initialSections={sections.map((section) => ({
					id: section.id,
					slug: section.slug,
					sortOrder: section.sortOrder,
					imageUrl: section.imageUrl ?? "",
					translations: localeCodes.map((code) => {
						const translation = section.translations.find((candidate) => candidate.locale === code);
						return {
							locale: code,
							title: translation?.title ?? "",
							intro: translation?.intro ?? "",
						};
					}),
					items: section.items.map((item) => ({
						id: item.id,
						sortOrder: item.sortOrder,
						url: item.url ?? "",
						imageUrl: item.imageUrl ?? "",
						translations: localeCodes.map((code) => {
							const translation = item.translations.find((candidate) => candidate.locale === code);
							return {
								locale: code,
								title: translation?.title ?? "",
								body: translation?.body ?? "",
							};
						}),
					})),
				}))}
				blobConfigured={isBlobConfigured()}
				aiConfigured={isImageGenerationConfigured()}
			/>
		</div>
	);
}
