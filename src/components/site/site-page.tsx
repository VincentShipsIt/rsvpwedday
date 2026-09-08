import { notFound } from "next/navigation";
import type { EventView } from "@/components/site/events";
import { HashScrollFix } from "@/components/site/hash-scroll";
import { InvitationOpening } from "@/components/site/invitation-opening";
import { MusicToggle } from "@/components/site/music-toggle";
import { PageBlocks } from "@/components/site/page-blocks";
import { Particles } from "@/components/site/particles";
import { Reveal } from "@/components/site/reveal";
import { RichText } from "@/components/site/rich-text";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import type { StoryMilestoneView } from "@/components/site/story";
import { ThemePicker } from "@/components/site/theme-picker";
import { isHomePage } from "@/domain/blocks";
import { clampEffectsSettings } from "@/domain/effects-settings";
import { publicEvents } from "@/domain/event-visibility";
import { localizeGift, publishableGifts, sortByAvailability } from "@/domain/gifts";
import { resolveWeddingDate } from "@/domain/wedding-date";
import { BlockType, OpeningAnimation, SiteTheme } from "@/generated/prisma/enums";
import { getDictionary, t } from "@/i18n";
import { locales } from "@/i18n/locales";
import { db } from "@/lib/db";
import {
	localizePage,
	pageInclude,
	pageLabel,
	type SiteData,
	visibleBlocks,
} from "@/lib/page-content";
import { resolveOpeningAnimation } from "@/lib/site-effects";
import { buildSiteLinks } from "@/lib/site-links";
import { resolveSiteLocale } from "@/lib/site-locale";
import { dataTheme, resolveSiteTheme } from "@/lib/site-theme";

export type SitePageParams = {
	lang?: string;
	theme?: string;
	opening?: string;
	pick?: string;
	preview?: string;
};

// One renderer for every public page: the home page and every page the couple adds in the admin
// go through here, so the nav, theme, footer and effects can never drift apart between routes.
// The page's own content is whatever blocks it holds (`PageBlocks`).
export async function SitePage({ slug, params }: { slug: string; params: SitePageParams }) {
	const { lang, theme: themeParam, opening: openingParam, pick, preview } = params;
	// `?preview=1` is how the admin's theme thumbnails embed a page in an iframe. It drops the
	// first-load cover, which would otherwise hide every theme behind an identical closed
	// envelope, plus the particle canvas and music button that six small iframes have no use for.
	const isPreview = preview === "1";
	const showThemePicker = pick === "1";
	const locale = await resolveSiteLocale(lang);
	const dictionary = getDictionary(locale);
	const localeDefinition = locales[locale];

	const [settings, siteContent, pageRecords, events, milestones, giftRecords] = await Promise.all([
		db.settings.findUnique({ where: { id: 1 } }),
		db.siteContent.findUnique({ where: { id: 1 } }),
		db.page.findMany({ orderBy: { sortOrder: "asc" }, include: pageInclude }),
		db.event.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
		db.storyMilestone.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
		db.gift.findMany({
			orderBy: { sortOrder: "asc" },
			include: {
				translations: true,
				// Only whether it is spoken for; the public page never names who took what.
				claim: { select: { invitationId: true, guestName: true } },
			},
		}),
	]);

	const pages = pageRecords.map((page) => localizePage(page, locale));
	const page = pages.find((candidate) => candidate.slug === slug);
	if (!page) {
		notFound();
	}

	// Anyone can read this page, so it shows only the events the couple marked public. The
	// countdown below still resolves against `events`, the whole calendar, so hiding the welcome
	// dinner cannot move the date the site counts to.
	const localizedEvents: EventView[] = publicEvents(events).map((event) => {
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

	const gifts = sortByAvailability(
		publishableGifts(giftRecords.map((gift) => localizeGift(gift, locale)))
	);

	const site: SiteData = {
		eventCount: localizedEvents.length,
		milestoneCount: localizedMilestones.length,
		giftCount: gifts.length,
		hasSettings: Boolean(settings),
	};

	const blocks = visibleBlocks(page, site);
	// A page nobody has filled in yet is not a page a guest should land on; the home page always
	// renders, so the site never 404s on its own root.
	if (blocks.length === 0 && !isHomePage(page)) {
		notFound();
	}

	const theme = resolveSiteTheme(themeParam, siteContent?.theme ?? SiteTheme.EDITORIAL);
	const coupleNames = settings?.coupleNames ?? "";
	const { navLinks, footerLinks } = buildSiteLinks({ pages, site, dictionary });

	// The bar only sits over a photo when the page opens with one, which is what a hero block in
	// first position means.
	const leadHero = blocks[0]?.type === BlockType.HERO ? blocks[0] : null;
	const isNavOverPhoto =
		Boolean(leadHero?.imageUrl) && (theme === SiteTheme.EDITORIAL || theme === SiteTheme.MIDNIGHT);

	// `?opening=` previews a cover animation the same way `?theme=` previews a theme, and forces
	// the cover to show again in a session that has already opened one. Only the home page gets a
	// cover: it is the invitation's front door, not something to re-open on every inner page.
	const isHome = isHomePage(page);
	const openingAnimation =
		isPreview || !isHome
			? OpeningAnimation.NONE
			: resolveOpeningAnimation(
					openingParam,
					siteContent?.openingAnimation ?? OpeningAnimation.BLOOM
				);
	const hasParticles = !isPreview && (siteContent?.particlesEnabled ?? true);
	const musicUrl = isPreview ? null : (siteContent?.musicUrl ?? null);
	const effects = clampEffectsSettings(siteContent ?? {});

	return (
		<>
			<HashScrollFix />
			{openingAnimation !== OpeningAnimation.NONE && (
				<InvitationOpening
					coupleNames={coupleNames}
					theme={theme}
					animation={openingAnimation}
					heroImageUrl={leadHero?.imageUrl ?? null}
					holdSeconds={effects.openingHoldSeconds}
					speed={effects.openingSpeed}
					forceShow={Boolean(openingParam)}
					labels={{
						open: dictionary.site.openInvitationLabel,
						loading: dictionary.site.loadingLabel,
					}}
				/>
			)}
			<SiteNav
				coupleNames={coupleNames}
				locale={locale}
				theme={theme}
				links={navLinks}
				languageLabel={dictionary.common.languageLabel}
				isOverPhoto={isNavOverPhoto}
			/>
			<main
				lang={locale}
				dir={localeDefinition.dir}
				data-theme={dataTheme[theme]}
				className={isNavOverPhoto ? undefined : "pt-[var(--wed-nav-height)]"}
			>
				{/* Inside `<main>` so the canvas inherits this theme's `--color-*` tokens. */}
				{hasParticles && (
					<Particles
						theme={theme}
						count={effects.particleCount}
						seconds={effects.particleSeconds}
						speed={effects.particleSpeed}
						startsOnOpen={openingAnimation !== OpeningAnimation.NONE}
					/>
				)}
				{!isHome && (
					<Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 pb-4 pt-20 text-center">
						<h1 className="font-accent text-[clamp(2.5rem,7vw,4.5rem)] font-medium">
							{pageLabel(page, dictionary)}
						</h1>
						<RichText html={page.intro} className="max-w-2xl text-ink/70" />
					</Reveal>
				)}
				<PageBlocks
					blocks={blocks}
					context={{
						coupleNames,
						locale,
						dictionary,
						theme,
						events: localizedEvents,
						milestones: localizedMilestones,
						gifts,
						weddingDate: resolveWeddingDate(settings?.weddingDate, events).date,
						settings: settings
							? { rsvpDeadline: settings.rsvpDeadline, replyTo: settings.replyTo }
							: null,
					}}
				/>
			</main>
			<SiteFooter
				line={t(dictionary.site.footerLine, { coupleNames, year: new Date().getFullYear() })}
				links={footerLinks}
				theme={theme}
				hasThemePicker={showThemePicker}
			/>
			{musicUrl && (
				<MusicToggle
					src={musicUrl}
					theme={theme}
					volume={effects.musicVolume}
					labels={{
						play: dictionary.site.musicPlayLabel,
						pause: dictionary.site.musicPauseLabel,
					}}
				/>
			)}
			{showThemePicker && <ThemePicker currentTheme={theme} />}
		</>
	);
}
