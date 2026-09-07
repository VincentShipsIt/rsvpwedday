// Single list of the site-wide settings pages the admin can edit, shared by the sidebar and the
// website index cards. Page content itself lives in `/admin/pages`; what stays here is the data
// blocks display but do not own (events, milestones) and the site-wide look and feel.
export const WEBSITE_SECTIONS = [
	{ href: "/admin/website/events", label: "Events", description: "Event schedule and venues" },
	{ href: "/admin/website/story", label: "Milestones", description: "The story timeline" },
	{ href: "/admin/website/theme", label: "Theme", description: "Site theme and previews" },
	{
		href: "/admin/website/effects",
		label: "Effects",
		description: "Opening animation, particles, and music",
	},
	{
		href: "/admin/website/emails",
		label: "Emails",
		description: "Invite, reminder and confirmation copy",
	},
] as const;

export type WebsiteSectionHref = (typeof WEBSITE_SECTIONS)[number]["href"];
