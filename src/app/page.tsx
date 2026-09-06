import { Events, type EventView } from "@/components/site/events";
import { Gallery } from "@/components/site/gallery";
import { Hero } from "@/components/site/hero";
import { RsvpSection } from "@/components/site/rsvp-section";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { Story, type StoryMilestoneView } from "@/components/site/story";
import { getDictionary, t } from "@/i18n";
import { locales } from "@/i18n/locales";
import { db } from "@/lib/db";
import { resolveSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export default async function LandingPage({
	searchParams,
}: {
	searchParams: Promise<{ lang?: string }>;
}) {
	const { lang } = await searchParams;
	const locale = await resolveSiteLocale(lang);
	const dictionary = getDictionary(locale);
	const localeDefinition = locales[locale];

	const [settings, events, siteContent, milestones] = await Promise.all([
		db.settings.findUnique({ where: { id: 1 } }),
		db.event.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
		db.siteContent.findUnique({ where: { id: 1 }, include: { translations: true } }),
		db.storyMilestone.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
	]);

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

	return (
		<>
			<SiteNav
				coupleNames={coupleNames}
				locale={locale}
				labels={{
					story: dictionary.site.navStory,
					events: dictionary.site.navEvents,
					gallery: dictionary.site.navGallery,
					rsvp: dictionary.site.navRsvp,
				}}
			/>
			<main lang={locale} dir={localeDefinition.dir}>
				<Hero
					coupleNames={coupleNames}
					heroImageUrl={siteContent?.heroImageUrl ?? null}
					tagline={siteTranslation?.tagline ?? ""}
					firstEventStartsAt={firstEvent?.startsAt ?? null}
					locale={locale}
					dictionary={dictionary}
				/>
				<Story
					heading={dictionary.site.storyHeading}
					intro={siteTranslation?.storyIntro ?? ""}
					milestones={localizedMilestones}
				/>
				<Events
					heading={dictionary.site.eventsHeading}
					events={localizedEvents}
					locale={locale}
					dictionary={dictionary}
				/>
				<Gallery
					heading={dictionary.site.galleryHeading}
					imageUrls={siteContent?.galleryUrls ?? []}
				/>
				{settings && (
					<RsvpSection
						heading={dictionary.site.rsvpHeading}
						note={siteTranslation?.rsvpNote ?? ""}
						deadline={settings.rsvpDeadline}
						replyTo={settings.replyTo}
						locale={locale}
						deadlineTemplate={dictionary.site.rsvpDeadlineLabel}
						questionsTemplate={dictionary.site.rsvpQuestions}
					/>
				)}
			</main>
			<SiteFooter
				line={t(dictionary.site.footerLine, { coupleNames, year: new Date().getFullYear() })}
			/>
		</>
	);
}
