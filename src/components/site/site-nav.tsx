import Link from "next/link";
import { LanguageSelect } from "@/components/site/language-select";
import { NavMobileMenu } from "@/components/site/nav-mobile-menu";
import { StickyHeader } from "@/components/site/sticky-header";
import { type Locale, SiteTheme } from "@/generated/prisma/enums";
import type { SiteLink } from "@/lib/site-links";
import { dataTheme } from "@/lib/site-theme";

// Background, border colour, and blur live in `globals.css` under `[data-nav]`, so the bar is
// transparent at rest and fills in once scrolled. Only structural differences stay here.
const navClassNames: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "border-b",
	[SiteTheme.MODERN]: "border-b",
	[SiteTheme.GARDEN]: "border-b",
	[SiteTheme.MIDNIGHT]: "border-b",
	[SiteTheme.BOHO]: "border-b-4",
	[SiteTheme.VINTAGE]: "border-b",
	[SiteTheme.MEDITERRANEAN]: "border-b",
};

// The couple's wordmark is set in `--font-accent` everywhere at the same size; kept as a record
// so a theme with a lighter script face can step up on its own.
const wordmarkClassNames: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "text-lg",
	[SiteTheme.MODERN]: "text-lg",
	[SiteTheme.GARDEN]: "text-lg",
	[SiteTheme.MIDNIGHT]: "text-lg",
	[SiteTheme.BOHO]: "text-lg",
	[SiteTheme.VINTAGE]: "text-lg",
	[SiteTheme.MEDITERRANEAN]: "text-lg",
};

const linkClassNames: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "",
	[SiteTheme.MODERN]: "text-xs font-medium uppercase tracking-wide",
	[SiteTheme.GARDEN]: "",
	[SiteTheme.MIDNIGHT]: "",
	[SiteTheme.BOHO]: "rounded-full px-3 py-1",
	[SiteTheme.VINTAGE]: "",
	[SiteTheme.MEDITERRANEAN]: "text-xs uppercase tracking-[0.2em]",
};

export function SiteNav({
	coupleNames,
	locale,
	theme,
	links,
	languageLabel,
	isOverPhoto,
}: {
	coupleNames: string;
	locale: Locale;
	theme: SiteTheme;
	/** From `buildSiteLinks`, so the nav, mobile menu, and footer always agree. */
	links: SiteLink[];
	languageLabel: string;
	isOverPhoto: boolean;
}) {
	return (
		<StickyHeader
			dataTheme={dataTheme[theme]}
			className={`fixed inset-x-0 top-0 z-20 ${navClassNames[theme]}${isOverPhoto ? " nav-over-photo" : ""}`}
		>
			<nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 text-sm">
				<Link href="/#top" className={`font-accent ${wordmarkClassNames[theme]}`}>
					{coupleNames}
				</Link>
				<div className="flex items-center gap-4">
					{/* Links: inline from `lg:` up (six of them, longer still in German, plus the language select no
					    longer fit at `md`), behind `NavMobileMenu`'s toggle below it, so this list only
					    ever renders once at a time per breakpoint. */}
					<div className="hidden flex-wrap items-center gap-6 lg:flex">
						{links.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className={`link-underline hover:text-green ${linkClassNames[theme]}`}
							>
								{link.label}
							</Link>
						))}
					</div>
					<LanguageSelect locale={locale} label={languageLabel} />
					<NavMobileMenu links={links} linkClassName={linkClassNames[theme]} />
				</div>
			</nav>
		</StickyHeader>
	);
}
