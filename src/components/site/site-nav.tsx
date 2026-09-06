import { LanguageSelect } from "@/components/site/language-select";
import { NavMobileMenu } from "@/components/site/nav-mobile-menu";
import { type Locale, SiteTheme } from "@/generated/prisma/enums";
import { dataTheme } from "@/lib/site-theme";

const navClassNames: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "border-b border-ink/10 bg-ivory/80 backdrop-blur",
	[SiteTheme.MODERN]: "border-b border-ink/15 bg-ivory/95",
	[SiteTheme.GARDEN]: "border-b border-ink/10 bg-ivory/85 backdrop-blur",
	// `SiteNav` has no scroll state (a server component), so rather than adding scroll-tracking
	// JS for one theme, this always-on translucent dark bar is the pragmatic choice: it reads
	// fine both over the dark hero and once sticky.
	[SiteTheme.MIDNIGHT]: "border-b border-green/20 bg-black/30 backdrop-blur",
	[SiteTheme.BOHO]: "border-b-4 border-ink bg-ivory",
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
}: {
	coupleNames: string;
	locale: Locale;
	theme: SiteTheme;
	labels: { story: string; events: string; gallery: string; rsvp: string; language: string };
	hasStory: boolean;
	hasEvents: boolean;
	hasGallery: boolean;
}) {
	const navLinks = [
		hasStory && { href: "#story", label: labels.story },
		hasEvents && { href: "#events", label: labels.events },
		hasGallery && { href: "#gallery", label: labels.gallery },
		{ href: "#rsvp", label: labels.rsvp },
	].filter((link): link is { href: string; label: string } => Boolean(link));

	return (
		<header data-theme={dataTheme[theme]} className={`sticky top-0 z-20 ${navClassNames[theme]}`}>
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
								className={`hover:text-green ${linkClassNames[theme]}`}
							>
								{link.label}
							</a>
						))}
					</div>
					<LanguageSelect locale={locale} label={labels.language} />
					<NavMobileMenu links={navLinks} linkClassName={linkClassNames[theme]} />
				</div>
			</nav>
		</header>
	);
}
