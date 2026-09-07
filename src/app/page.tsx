import { Events, type EventView } from "@/components/site/events";
import { Gallery } from "@/components/site/gallery";
import { HashScrollFix } from "@/components/site/hash-scroll";
import { Hero } from "@/components/site/hero";
import { InvitationOpening } from "@/components/site/invitation-opening";
import { RsvpSection } from "@/components/site/rsvp-section";
import { SectionDivider } from "@/components/site/section-divider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { Story, type StoryMilestoneView } from "@/components/site/story";
import { ThemePicker } from "@/components/site/theme-picker";
import { SiteTheme } from "@/generated/prisma/enums";
import { getDictionary, t } from "@/i18n";
import { locales } from "@/i18n/locales";
import { db } from "@/lib/db";
import { resolveSiteLocale } from "@/lib/site-locale";
import { dataTheme, resolveSiteTheme } from "@/lib/site-theme";

export const dynamic = "force-dynamic";

export default async function LandingPage({
	searchParams,
}: {
	searchParams: Promise<{ lang?: string; theme?: string; pick?: string; preview?: string }>;
}) {
	const { lang, theme: themeParam, pick: pickParam, preview: previewParam } = await searchParams;
	// `?preview=1` is how the admin's theme thumbnails embed this page in an iframe. The only
	// thing it changes is the first-load invitation cover, which would otherwise hide every
	// theme behind an identical closed envelope and make the thumbnails useless.
	const isPreview = previewParam === "1";
	const showThemePicker = pickParam === "1";
	const locale = await resolveSiteLocale(lang);
	const dictionary = getDictionary(locale);
	const localeDefinition = locales[locale];

	const [settings, events, siteContent, milestones] = await Promise.all([
		db.settings.findUnique({ where: { id: 1 } }),
		db.event.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
		db.siteContent.findUnique({ where: { id: 1 }, include: { translations: true } }),
		db.storyMilestone.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
	]);

	const theme = resolveSiteTheme(themeParam, siteContent?.theme ?? SiteTheme.EDITORIAL);
	const isNavOverPhoto =
		Boolean(siteContent?.heroImageUrl) &&
		(theme === SiteTheme.EDITORIAL || theme === SiteTheme.MIDNIGHT);

	const coupleNames = settings?.coupleNames ?? "";

	const localizedEvents: EventView[] = events.map((event) => {
		const translation =
			event.translations.find((candidate) => candidate.locale === locale) ?? event.translations[0];
		return {
			id: event.id,
			slug: event.slug,
			name: translation?.name ?? event.slug,
			description: translation?.description ?? null,
			startsAt: event.startsAt,
			venue: event.venue,
			address: event.address,
			mapsUrl: event.mapsUrl,
			dressCode: event.dressCode,
		};
	});

	const siteTranslation =
		siteContent?.translations.find((candidate) => candidate.locale === locale) ??
		siteContent?.translations[0];

	const localizedMilestones: StoryMilestoneView[] = milestones.map((milestone) => {
		const translation =
			milestone.translations.find((candidate) => candidate.locale === locale) ??
			milestone.translations[0];
		return {
			id: milestone.id,
			dateLabel: milestone.dateLabel,
			imageUrl: milestone.imageUrl,
			title: translation?.title ?? "",
			body: translation?.body ?? "",
		};
	});

	const firstEvent = localizedEvents[0] ?? null;
	const hasStory = localizedMilestones.length > 0;
	const hasEvents = localizedEvents.length > 0;
	const hasGallery = (siteContent?.galleryUrls ?? []).length > 0;

	const hasInvitationOpening =
		!isPreview && (theme === SiteTheme.VINTAGE || theme === SiteTheme.GARDEN);

	return (
		<>
			<HashScrollFix />
			{hasInvitationOpening && (
				<InvitationOpening
					coupleNames={coupleNames}
					theme={theme}
					openLabel={dictionary.site.openInvitationLabel}
				/>
			)}
			<SiteNav
				coupleNames={coupleNames}
				locale={locale}
				theme={theme}
				labels={{
					story: dictionary.site.navStory,
					events: dictionary.site.navEvents,
					gallery: dictionary.site.navGallery,
					rsvp: dictionary.site.navRsvp,
					language: dictionary.common.languageLabel,
				}}
				hasStory={hasStory}
				hasEvents={hasEvents}
				hasGallery={hasGallery}
				isOverPhoto={isNavOverPhoto}
			/>
			<main
				lang={locale}
				dir={localeDefinition.dir}
				data-theme={dataTheme[theme]}
				className={isNavOverPhoto ? undefined : "pt-[var(--wed-nav-height)]"}
			>
				<Hero
					coupleNames={coupleNames}
					heroImageUrl={siteContent?.heroImageUrl ?? null}
					tagline={siteTranslation?.tagline ?? ""}
					firstEventStartsAt={firstEvent?.startsAt ?? null}
					locale={locale}
					dictionary={dictionary}
					theme={theme}
				/>
				<SectionDivider theme={theme} />
				<Story
					heading={siteTranslation?.storyHeading || dictionary.site.storyHeading}
					intro={siteTranslation?.storyIntro ?? ""}
					milestones={localizedMilestones}
					theme={theme}
				/>
				<SectionDivider theme={theme} />
				<Events
					heading={siteTranslation?.eventsHeading || dictionary.site.eventsHeading}
					events={localizedEvents}
					locale={locale}
					dictionary={dictionary}
					theme={theme}
				/>
				<SectionDivider theme={theme} />
				<Gallery
					heading={siteTranslation?.galleryHeading || dictionary.site.galleryHeading}
					imageUrls={siteContent?.galleryUrls ?? []}
					theme={theme}
				/>
				{settings && (
					<>
						<SectionDivider theme={theme} />
						<RsvpSection
							heading={siteTranslation?.rsvpHeading || dictionary.site.rsvpHeading}
							note={siteTranslation?.rsvpNote ?? ""}
							deadline={settings.rsvpDeadline}
							replyTo={settings.replyTo}
							locale={locale}
							deadlineTemplate={dictionary.site.rsvpDeadlineLabel}
							questionsTemplate={dictionary.site.rsvpQuestions}
						/>
					</>
				)}
			</main>
			<SiteFooter
				line={t(dictionary.site.footerLine, { coupleNames, year: new Date().getFullYear() })}
				theme={theme}
				hasThemePicker={showThemePicker}
			/>
			{showThemePicker && <ThemePicker currentTheme={theme} />}
		</>
	);
}
