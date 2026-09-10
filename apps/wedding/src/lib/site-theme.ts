import { SiteTheme } from "@/generated/prisma/enums";

const themeParams: Record<string, SiteTheme> = {
	editorial: SiteTheme.EDITORIAL,
	modern: SiteTheme.MODERN,
	garden: SiteTheme.GARDEN,
	midnight: SiteTheme.MIDNIGHT,
	boho: SiteTheme.BOHO,
	vintage: SiteTheme.VINTAGE,
	mediterranean: SiteTheme.MEDITERRANEAN,
};

// The landing page also accepts `?theme=` so every theme can be previewed by URL; a stored
// `siteContent.theme` is the fallback for everyone else.
export function resolveSiteTheme(
	themeParam: string | undefined,
	storedTheme: SiteTheme
): SiteTheme {
	if (themeParam && Object.hasOwn(themeParams, themeParam)) {
		return themeParams[themeParam];
	}

	return storedTheme;
}

export const dataTheme: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "editorial",
	[SiteTheme.MODERN]: "modern",
	[SiteTheme.GARDEN]: "garden",
	[SiteTheme.MIDNIGHT]: "midnight",
	[SiteTheme.BOHO]: "boho",
	[SiteTheme.VINTAGE]: "vintage",
	[SiteTheme.MEDITERRANEAN]: "mediterranean",
};

// The theme picker (Part 2) needs the `?theme=` param key alongside the enum and a display label.
// Kept as a literal `Record`-backed list (rather than deriving `dataTheme` from it) so every
// `Record<SiteTheme, ...>` in the codebase, this one included, stays a plain object literal that
// TypeScript checks for a missing `SiteTheme` member at compile time.
export const themeChoices: { key: string; theme: SiteTheme; label: string }[] = [
	{ key: "editorial", theme: SiteTheme.EDITORIAL, label: "Editorial" },
	{ key: "modern", theme: SiteTheme.MODERN, label: "Modern" },
	{ key: "garden", theme: SiteTheme.GARDEN, label: "Garden" },
	{ key: "midnight", theme: SiteTheme.MIDNIGHT, label: "Midnight" },
	{ key: "boho", theme: SiteTheme.BOHO, label: "Boho" },
	{ key: "vintage", theme: SiteTheme.VINTAGE, label: "Vintage" },
	{ key: "mediterranean", theme: SiteTheme.MEDITERRANEAN, label: "Mediterranean" },
];
