// Single list of the home-page sections the admin can edit, shared by the sidebar, the website
// index cards and the per-section back link.
export const WEBSITE_SECTIONS = [
	{ href: "/admin/website/hero", label: "Hero", description: "Hero photo and tagline" },
	{ href: "/admin/website/story", label: "Story", description: "Story intro and milestones" },
	{ href: "/admin/website/events", label: "Events", description: "Event schedule and venues" },
	{
		href: "/admin/website/guide",
		label: "Travel guide",
		description: "Destination guide page: getting there, where to stay, things to see",
	},
	{ href: "/admin/website/gallery", label: "Gallery", description: "Gallery photos" },
	{ href: "/admin/website/faq", label: "FAQ", description: "Questions and answers before RSVP" },
	{ href: "/admin/website/rsvp", label: "RSVP", description: "RSVP note shown to guests" },
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
