// The site-wide settings pages, shared by the sidebar and the Settings index cards. Page content
// itself lives in `/admin/pages`; these are the wedding's own data and the site's look and feel,
// which blocks display but do not own.
export const SETTINGS_SECTIONS = [
	{
		href: "/admin/settings/events",
		label: "Events",
		description: "The schedule, venues and dress codes",
	},
	{
		href: "/admin/settings/milestones",
		label: "Milestones",
		description: "The story timeline",
	},
	{ href: "/admin/settings/theme", label: "Theme", description: "Site theme and previews" },
	{
		href: "/admin/settings/effects",
		label: "Effects",
		description: "Opening animation, particles and music",
	},
] as const;

export type SettingsSectionHref = (typeof SETTINGS_SECTIONS)[number]["href"];
