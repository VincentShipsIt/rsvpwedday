export const studio = {
	name: "Say Yes",
	short: "Yes",
	hero: "You said Yes.",
	baseline: "We handle the rest.",
	enquiryEmail: "studio@sayyess.com",
	places: ["Malta", "Gozo", "Puglia", "Berlin"],
	guestSiteUrl: process.env.NEXT_PUBLIC_GUEST_SITE_URL ?? "http://localhost:3010",
	consoleUrl: process.env.NEXT_PUBLIC_CONSOLE_URL ?? "http://localhost:3011",
} as const;
