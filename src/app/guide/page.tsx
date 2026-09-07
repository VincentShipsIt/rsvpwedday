import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Guide } from "@/components/site/guide";
import { HashScrollFix } from "@/components/site/hash-scroll";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { SiteTheme } from "@/generated/prisma/enums";
import { getDictionary, t } from "@/i18n";
import { locales } from "@/i18n/locales";
import { db } from "@/lib/db";
import { guideSectionsQuery, localizeGuideSections } from "@/lib/guide-content";
import { buildSiteLinks, homeAnchorLinks } from "@/lib/site-links";
import { resolveSiteLocale } from "@/lib/site-locale";
import { dataTheme, resolveSiteTheme } from "@/lib/site-theme";

export const dynamic = "force-dynamic";

type GuidePageProps = { searchParams: Promise<{ lang?: string; theme?: string }> };

export async function generateMetadata({ searchParams }: GuidePageProps): Promise<Metadata> {
	const { lang } = await searchParams;
	const locale = await resolveSiteLocale(lang);
	const dictionary = getDictionary(locale);
	const [settings, siteContent] = await Promise.all([
		db.settings.findUnique({ where: { id: 1 } }),
		db.siteContent.findUnique({ where: { id: 1 }, include: { translations: true } }),
	]);
	const guideTitle =
		siteContent?.translations.find((translation) => translation.locale === locale)?.guideTitle ||
		dictionary.site.guideHeading;
	return { title: settings ? `${guideTitle} — ${settings.coupleNames}` : guideTitle };
}

// The destination guide: the same nav, theme, and footer as the home page around one long,
// anchored article. Everything on it is typed into `/admin/website/guide`; with no sections the
// route 404s, matching the nav link and teaser that only appear once content exists.
export default async function GuidePage({ searchParams }: GuidePageProps) {
	const { lang, theme: themeParam } = await searchParams;
	const locale = await resolveSiteLocale(lang);
	const dictionary = getDictionary(locale);
	const localeDefinition = locales[locale];

	const [settings, siteContent, sections, milestoneCount, eventCount, faqCount] = await Promise.all(
		[
			db.settings.findUnique({ where: { id: 1 } }),
			db.siteContent.findUnique({ where: { id: 1 }, include: { translations: true } }),
			db.guideSection.findMany(guideSectionsQuery),
			db.storyMilestone.count(),
			db.event.count(),
			db.faqEntry.count(),
		]
	);

	if (sections.length === 0) {
		notFound();
	}

	const theme = resolveSiteTheme(themeParam, siteContent?.theme ?? SiteTheme.EDITORIAL);
	const coupleNames = settings?.coupleNames ?? "";
	const siteTranslation =
		siteContent?.translations.find((candidate) => candidate.locale === locale) ??
		siteContent?.translations[0];
	const guideTitle = siteTranslation?.guideTitle || dictionary.site.guideHeading;

	const links = buildSiteLinks({
		dictionary,
		guideTitle,
		hasStory: milestoneCount > 0 || Boolean(siteTranslation?.storyIntro),
		hasEvents: eventCount > 0,
		hasGuide: true,
		hasGallery: (siteContent?.galleryUrls ?? []).length > 0,
		hasFaq: faqCount > 0,
	});

	return (
		<>
			<HashScrollFix />
			<SiteNav
				coupleNames={coupleNames}
				locale={locale}
				theme={theme}
				links={homeAnchorLinks(links)}
				languageLabel={dictionary.common.languageLabel}
				isOverPhoto={false}
			/>
			<main
				lang={locale}
				dir={localeDefinition.dir}
				data-theme={dataTheme[theme]}
				className="pt-[var(--wed-nav-height)]"
			>
				<Guide
					title={guideTitle}
					intro={siteTranslation?.guideIntro ?? ""}
					sections={localizeGuideSections(sections, locale)}
					linkLabel={dictionary.site.guideLinkLabel}
				/>
			</main>
			<SiteFooter
				line={t(dictionary.site.footerLine, { coupleNames, year: new Date().getFullYear() })}
				links={links}
				theme={theme}
			/>
		</>
	);
}
