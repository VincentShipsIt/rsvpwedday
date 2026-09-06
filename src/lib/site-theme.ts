import { SiteTheme } from "@/generated/prisma/enums";

const themeParams: Record<string, SiteTheme> = {
	editorial: SiteTheme.EDITORIAL,
	modern: SiteTheme.MODERN,
	garden: SiteTheme.GARDEN,
};

// The landing page also accepts `?theme=` so every theme can be previewed by URL; a stored
// `siteContent.theme` is the fallback for everyone else.
export function resolveSiteTheme(
	themeParam: string | undefined,
	storedTheme: SiteTheme
): SiteTheme {
	if (themeParam && themeParam in themeParams) {
		return themeParams[themeParam];
	}

	return storedTheme;
}

export const dataTheme: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "editorial",
	[SiteTheme.MODERN]: "modern",
	[SiteTheme.GARDEN]: "garden",
};
