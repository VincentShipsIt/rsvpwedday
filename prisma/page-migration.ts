import { HOME_PAGE_SLUG } from "@/domain/blocks";
import { BlockType, type Locale } from "@/generated/prisma/enums";
import { localeCodes } from "@/i18n/locales";
import { db } from "@/lib/db";

/*
 * One-time move of the fixed home page and the guide into `Page`/`Block` rows. Guarded on the
 * page count, so a database that already has pages is never touched, and it runs on every deploy
 * (`scripts/prepare-database.ts`) and in the dev seed after `seedContent`, so both a live site
 * and a fresh checkout end up with the same block layout. The source columns and tables
 * (`SiteContent*`, `GuideSection`, `FaqEntry`) are left in place; nothing reads them afterwards.
 */
export async function migrateToPages(): Promise<"migrated" | "skipped"> {
	if ((await db.page.count()) > 0) {
		return "skipped";
	}

	const [siteContent, guideSections, faqEntries] = await Promise.all([
		db.siteContent.findUnique({ where: { id: 1 }, include: { translations: true } }),
		db.guideSection.findMany({
			orderBy: { sortOrder: "asc" },
			include: {
				translations: true,
				items: { orderBy: { sortOrder: "asc" }, include: { translations: true } },
			},
		}),
		db.faqEntry.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
	]);

	const translation = (locale: Locale) =>
		siteContent?.translations.find((candidate) => candidate.locale === locale);
	const perLocale = (pick: (locale: Locale) => { title?: string; body?: string }) =>
		localeCodes.map((locale) => {
			const values = pick(locale);
			return { locale, title: values.title ?? "", body: values.body ?? "" };
		});

	const hasGuide = guideSections.length > 0;

	await db.$transaction(async (tx) => {
		const home = await tx.page.create({
			data: {
				slug: HOME_PAGE_SLUG,
				sortOrder: 0,
				translations: { create: localeCodes.map((locale) => ({ locale })) },
			},
		});

		const homeBlocks: Array<{
			type: BlockType;
			anchor: string;
			imageUrl?: string | null;
			imageUrls?: string[];
			url?: string | null;
			translations: { locale: Locale; title: string; body: string }[];
		}> = [
			{
				type: BlockType.HERO,
				anchor: "",
				imageUrl: siteContent?.heroImageUrl ?? null,
				translations: perLocale((locale) => ({ title: translation(locale)?.tagline })),
			},
			{
				type: BlockType.STORY,
				anchor: "story",
				translations: perLocale((locale) => ({
					title: translation(locale)?.storyHeading,
					body: translation(locale)?.storyIntro,
				})),
			},
			{
				type: BlockType.EVENTS,
				anchor: "events",
				translations: perLocale((locale) => ({ title: translation(locale)?.eventsHeading })),
			},
			...(hasGuide
				? [
						{
							type: BlockType.PAGE_LINK,
							anchor: "",
							url: "/guide",
							imageUrl: guideSections.find((section) => section.imageUrl)?.imageUrl ?? null,
							translations: perLocale((locale) => ({
								title: translation(locale)?.guideTitle,
								body: translation(locale)?.guideIntro,
							})),
						},
					]
				: []),
			{
				type: BlockType.GALLERY,
				anchor: "gallery",
				imageUrls: siteContent?.galleryUrls ?? [],
				translations: perLocale((locale) => ({ title: translation(locale)?.galleryHeading })),
			},
			{
				type: BlockType.FAQ,
				anchor: "faq",
				translations: perLocale(() => ({})),
			},
			{
				type: BlockType.RSVP,
				anchor: "rsvp",
				translations: perLocale((locale) => ({
					title: translation(locale)?.rsvpHeading,
					body: translation(locale)?.rsvpNote,
				})),
			},
		];

		for (const [sortOrder, block] of homeBlocks.entries()) {
			const created = await tx.block.create({
				data: {
					pageId: home.id,
					sortOrder,
					type: block.type,
					anchor: block.anchor,
					imageUrl: block.imageUrl ?? null,
					imageUrls: block.imageUrls ?? [],
					url: block.url ?? null,
					translations: { create: block.translations },
				},
			});
			if (block.type === BlockType.FAQ) {
				for (const [itemOrder, entry] of faqEntries.entries()) {
					await tx.blockItem.create({
						data: {
							blockId: created.id,
							sortOrder: itemOrder,
							translations: {
								create: entry.translations.map((t) => ({
									locale: t.locale,
									title: t.question,
									body: t.answer,
								})),
							},
						},
					});
				}
			}
		}

		if (!hasGuide) {
			return;
		}

		const guide = await tx.page.create({
			data: {
				slug: "guide",
				sortOrder: 1,
				translations: {
					create: localeCodes.map((locale) => ({
						locale,
						title: translation(locale)?.guideTitle ?? "",
						intro: translation(locale)?.guideIntro ?? "",
					})),
				},
			},
		});

		for (const [sortOrder, section] of guideSections.entries()) {
			await tx.block.create({
				data: {
					pageId: guide.id,
					sortOrder,
					type: BlockType.CARDS,
					anchor: section.slug,
					imageUrl: section.imageUrl,
					translations: {
						create: section.translations.map((t) => ({
							locale: t.locale,
							title: t.title,
							body: t.intro,
						})),
					},
					items: {
						create: section.items.map((item) => ({
							sortOrder: item.sortOrder,
							url: item.url,
							imageUrl: item.imageUrl,
							translations: {
								create: item.translations.map((t) => ({
									locale: t.locale,
									title: t.title,
									body: t.body,
								})),
							},
						})),
					},
				},
			});
		}
	});

	return "migrated";
}
