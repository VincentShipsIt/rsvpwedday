import { SiteTheme } from "@/generated/prisma/enums";

/*
 * Email-safe projection of each landing-page theme (`[data-theme]` blocks in `globals.css`).
 * Mail clients cannot load the site's web fonts, so each display font maps to the closest stack
 * that ships with every OS; the colours are the theme's own tokens copied verbatim.
 */
export type EmailTheme = {
	background: string;
	surface: string;
	ink: string;
	muted: string;
	accent: string;
	accentText: string;
	border: string;
	headingFont: string;
	bodyFont: string;
	radius: string;
};

const serif = "Georgia, 'Times New Roman', serif";
const sans = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export const emailThemes: Record<SiteTheme, EmailTheme> = {
	[SiteTheme.EDITORIAL]: {
		background: "#faf7f0",
		surface: "#ffffff",
		ink: "#26241f",
		muted: "#6b675f",
		accent: "#2f4d3a",
		accentText: "#ffffff",
		border: "#e6e0d1",
		headingFont: serif,
		bodyFont: sans,
		radius: "12px",
	},
	[SiteTheme.MODERN]: {
		background: "#f7f5f1",
		surface: "#ffffff",
		ink: "#111111",
		muted: "#5c5c5c",
		accent: "#c8552d",
		accentText: "#ffffff",
		border: "#e2ded6",
		headingFont: serif,
		bodyFont: sans,
		radius: "0px",
	},
	[SiteTheme.GARDEN]: {
		background: "#f6e7e1",
		surface: "#fffaf7",
		ink: "#3b2f2f",
		muted: "#7a6666",
		accent: "#b5533c",
		accentText: "#ffffff",
		border: "#ead3ca",
		headingFont: serif,
		bodyFont: serif,
		radius: "24px",
	},
	[SiteTheme.MIDNIGHT]: {
		background: "#0f1113",
		surface: "#17191c",
		ink: "#ece7dd",
		muted: "#a9a49a",
		accent: "#c9a961",
		accentText: "#0f1113",
		border: "#2a2d31",
		headingFont: serif,
		bodyFont: sans,
		radius: "12px",
	},
	[SiteTheme.BOHO]: {
		background: "#f3e9d2",
		surface: "#fbf6ea",
		ink: "#2b2622",
		muted: "#6e6459",
		accent: "#d97b3a",
		accentText: "#ffffff",
		border: "#e4d6b6",
		headingFont: serif,
		bodyFont: sans,
		radius: "24px",
	},
	[SiteTheme.VINTAGE]: {
		background: "#f8f0d7",
		surface: "#fdf8ea",
		ink: "#4a3826",
		muted: "#7d6a55",
		accent: "#8a9a72",
		accentText: "#ffffff",
		border: "#e3d7b4",
		headingFont: serif,
		bodyFont: serif,
		radius: "4px",
	},
};
