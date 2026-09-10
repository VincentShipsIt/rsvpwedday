export type FeatureFlag =
	| "site"
	| "rsvp"
	| "gifts"
	| "photos"
	| "liveWall"
	| "seating"
	| "messaging";

export type PartnerCategory = "venue" | "kitchen" | "flowers" | "photo";

export type Request = {
	id: string;
	couple: string;
	place: string;
	date: string;
	domain: string;
	guestOrigin: string;
	fee: number;
	budget: number;
	bookedVendorTotal: number;
	ourCost: number;
	status: "option" | "confirmed" | "day-of";
	features: FeatureFlag[];
};

export const euro = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 0,
});

export const requests: Request[] = [
	{
		id: "elisa-jonas",
		couple: "Elisa & Jonas",
		place: "Gozo",
		date: "2 May 2027",
		domain: "elisajonas.example",
		guestOrigin: process.env.NEXT_PUBLIC_GUEST_SITE_URL ?? "http://localhost:3010",
		fee: 14000,
		budget: 82000,
		bookedVendorTotal: 41000,
		ourCost: 33500,
		status: "confirmed",
		features: ["site", "rsvp", "gifts", "photos", "liveWall"],
	},
	{
		id: "amina-leo",
		couple: "Amina & Leo",
		place: "Berlin",
		date: "18 Sep 2027",
		domain: "amina-leo.ateliervero.example",
		guestOrigin: process.env.NEXT_PUBLIC_GUEST_SITE_URL ?? "http://localhost:3010",
		fee: 9000,
		budget: 54000,
		bookedVendorTotal: 12000,
		ourCost: 9800,
		status: "option",
		features: ["site", "rsvp"],
	},
	{
		id: "maya-tomas",
		couple: "Maya & Tomas",
		place: "Puglia",
		date: "12 Jun 2027",
		domain: "mayaandtomas.example",
		guestOrigin: process.env.NEXT_PUBLIC_GUEST_SITE_URL ?? "http://localhost:3010",
		fee: 18000,
		budget: 110000,
		bookedVendorTotal: 67000,
		ourCost: 54000,
		status: "day-of",
		features: ["site", "rsvp", "gifts", "photos", "liveWall", "seating", "messaging"],
	},
];

export function pipelineValue(request: Request): number {
	return request.fee + (request.bookedVendorTotal - request.ourCost);
}

export const partners: {
	id: string;
	name: string;
	category: PartnerCategory;
	place: string;
	note: string;
}[] = [
	{
		id: "ta-cenc",
		name: "Ta' Ċenċ",
		category: "venue",
		place: "Gozo",
		note: "Clifftop, 180 seated, our house for May.",
	},
	{
		id: "trattoria-luna",
		name: "Trattoria Luna",
		category: "kitchen",
		place: "Victoria",
		note: "Family kitchen. Child plates without a named list.",
	},
	{
		id: "campo-fiori",
		name: "Campo Fiori",
		category: "flowers",
		place: "Noto",
		note: "Dried citrus, olive, no foam.",
	},
	{
		id: "lens-mira",
		name: "Mira Lens",
		category: "photo",
		place: "Berlin / Malta",
		note: "Uploads to the photographer seat, not the guest QR.",
	},
];

export const featureLabels: Record<FeatureFlag, string> = {
	site: "Site",
	rsvp: "RSVP",
	gifts: "Gifts",
	photos: "Album",
	liveWall: "Live wall",
	seating: "Seating",
	messaging: "WhatsApp",
};

export const categoryLabels: Record<PartnerCategory, string> = {
	venue: "Venue",
	kitchen: "Kitchen",
	flowers: "Flowers",
	photo: "Photo",
};
