import { LanguageSelect } from "@/components/site/language-select";
import { type Locale, SiteTheme } from "@/generated/prisma/enums";
import { dataTheme } from "@/lib/site-theme";

const navClassNames: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "border-b border-ink/10 bg-ivory/80 backdrop-blur",
	[SiteTheme.MODERN]: "border-b border-ink/15 bg-ivory/95",
	[SiteTheme.GARDEN]: "border-b border-ink/10 bg-ivory/85 backdrop-blur",
};

const linkClassNames: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "",
	[SiteTheme.MODERN]: "text-xs font-medium uppercase tracking-wide",
	[SiteTheme.GARDEN]: "",
};

export function SiteNav({
	coupleNames,
	locale,
	theme,
	labels,
}: {
	coupleNames: string;
	locale: Locale;
	theme: SiteTheme;
	labels: { story: string; events: string; gallery: string; rsvp: string; language: string };
}) {
	return (
		<header data-theme={dataTheme[theme]} className={`sticky top-0 z-20 ${navClassNames[theme]}`}>
			<nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 text-sm">
				<a href="#top" className="font-accent text-lg">
					{coupleNames}
				</a>
				<div className="flex flex-wrap items-center gap-6">
					<a href="#story" className={`hover:text-green ${linkClassNames[theme]}`}>
						{labels.story}
					</a>
					<a href="#events" className={`hover:text-green ${linkClassNames[theme]}`}>
						{labels.events}
					</a>
					<a href="#gallery" className={`hover:text-green ${linkClassNames[theme]}`}>
						{labels.gallery}
					</a>
					<a href="#rsvp" className={`hover:text-green ${linkClassNames[theme]}`}>
						{labels.rsvp}
					</a>
					<LanguageSelect locale={locale} label={labels.language} />
				</div>
			</nav>
		</header>
	);
}
