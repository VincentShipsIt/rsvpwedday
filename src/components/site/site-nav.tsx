import { LanguageSelect } from "@/components/site/language-select";
import { NavMobileMenu } from "@/components/site/nav-mobile-menu";
import { StickyHeader } from "@/components/site/sticky-header";
import { type Locale, SiteTheme } from "@/generated/prisma/enums";
import { dataTheme } from "@/lib/site-theme";

// Background, border colour, and blur live in `globals.css` under `[data-nav]`, so the bar is
// transparent at rest and fills in once scrolled. Only structural differences stay here.
const navClassNames: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "border-b",
	[SiteTheme.MODERN]: "border-b",
	[SiteTheme.GARDEN]: "border-b",
	[SiteTheme.MIDNIGHT]: "border-b",
	[SiteTheme.BOHO]: "border-b-4",
};

const linkClassNames: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "",
	[SiteTheme.MODERN]: "text-xs font-medium uppercase tracking-wide",
	[SiteTheme.GARDEN]: "",
	[SiteTheme.MIDNIGHT]: "",
	[SiteTheme.BOHO]: "rounded-full px-3 py-1",
};

export function SiteNav({
	coupleNames,
	locale,
	theme,
	labels,
	hasStory,
	hasEvents,
	hasGallery,
	isOverPhoto,
}: {
	coupleNames: string;
	locale: Locale;
	theme: SiteTheme;
	labels: { story: string; events: string; gallery: string; rsvp: string; language: string };
	hasStory: boolean;
	hasEvents: boolean;
	hasGallery: boolean;
	isOverPhoto: boolean;
}) {
	const navLinks = [
		hasStory && { href: "#story", label: labels.story },
		hasEvents && { href: "#events", label: labels.events },
		hasGallery && { href: "#gallery", label: labels.gallery },
		{ href: "#rsvp", label: labels.rsvp },
	].filter((link): link is { href: string; label: string } => Boolean(link));

	return (
		<StickyHeader
			dataTheme={dataTheme[theme]}
			className={`sticky top-0 z-20 ${navClassNames[theme]}${isOverPhoto ? " nav-over-photo" : ""}`}
		>
			<nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 text-sm">
				<a href="#top" className="font-accent text-lg">
					{coupleNames}
				</a>
				<div className="flex items-center gap-4">
					{/* Anchor links: inline from `sm:` up, behind `NavMobileMenu`'s toggle below
					    it, so this list only ever renders once at a time per breakpoint. */}
					<div className="hidden flex-wrap items-center gap-6 sm:flex">
						{navLinks.map((link) => (
							<a
								key={link.href}
								href={link.href}
								className={`link-underline hover:text-green ${linkClassNames[theme]}`}
							>
								{link.label}
							</a>
						))}
					</div>
					<LanguageSelect locale={locale} label={labels.language} />
					<NavMobileMenu links={navLinks} linkClassName={linkClassNames[theme]} />
				</div>
			</nav>
		</StickyHeader>
	);
}
