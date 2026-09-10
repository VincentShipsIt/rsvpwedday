export const studio = {
	name: "Atelier Vero",
	short: "Vero",
	tagline: "The weekend, held.",
	enquiryEmail: "studio@ateliervero.example",
	places: ["Malta", "Gozo", "Puglia", "Berlin"],
	guestSiteUrl: process.env.NEXT_PUBLIC_GUEST_SITE_URL ?? "http://localhost:3010",
	consoleUrl: process.env.NEXT_PUBLIC_CONSOLE_URL ?? "http://localhost:3011",
} as const;
