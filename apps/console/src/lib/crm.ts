export type FeatureFlag =
	| "site"
	| "rsvp"
	| "gifts"
	| "photos"
	| "liveWall"
	| "seating"
	| "messaging";

export type CoupleStatus =
	| "new"
	| "talking"
	| "option"
	| "confirmed"
	| "day-of"
	| "wrapped"
	| "lost";
export type ProviderKind = "venue" | "kitchen" | "flowers" | "photo" | "music" | "other";

export type Contact = {
	email?: string;
	phone?: string;
	whatsapp?: string;
	instagram?: string;
};

export type Channel = "email" | "instagram" | "whatsapp";

export type ThreadPersonKind = "couple" | "lead" | "client" | "provider";

export type InboxMessage = {
	id: string;
	direction: "in" | "out";
	body: string;
	at: string;
	channel: Channel;
};

export type Thread = {
	id: string;
	channel: Channel;
	subject?: string;
	contactName: string;
	handle: string;
	personId?: string;
	personKind?: ThreadPersonKind;
	unread: boolean;
	messages: InboxMessage[];
};

export type Place = {
	label: string;
	address?: string;
	lat?: number;
	lng?: number;
};

export type Couple = {
	id: string;
	couple: string;
	place: Place;
	date?: string;
	status: CoupleStatus;
	source?: string;
	contact: Contact;
	notes?: string;
	createdAt: string;
	domain?: string;
	guestOrigin?: string;
	fee: number;
	budget: number;
	bookedVendorTotal: number;
	ourCost: number;
	features: FeatureFlag[];
	providerIds: string[];
};

export type Provider = {
	id: string;
	name: string;
	kind: ProviderKind;
	place: Place;
	contact: Contact;
	website?: string;
	instagram?: string;
	hours?: string;
	capacity?: string;
	notes?: string;
	/* A listing shows a rating only when somebody has actually recorded one —
	   there is no reviews provider wired, so these stay empty until filled. */
	rating?: number;
	reviewCount?: number;
	reviewsUrl?: string;
	tags: string[];
};

export type CrmData = {
	couples: Couple[];
	providers: Provider[];
	threads: Thread[];
};

export const channelLabels: Record<Channel, string> = {
	email: "Email",
	instagram: "Instagram",
	whatsapp: "WhatsApp",
};

export const channels: Channel[] = ["email", "instagram", "whatsapp"];

export const euro = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 0,
});

export const coupleStatusLabels: Record<CoupleStatus, string> = {
	new: "New",
	talking: "Talking",
	option: "Option",
	confirmed: "Confirmed",
	"day-of": "Day-of",
	wrapped: "Wrapped",
	lost: "Lost",
};

export const providerKindLabels: Record<ProviderKind, string> = {
	venue: "Venue",
	kitchen: "Kitchen",
	flowers: "Flowers",
	photo: "Photo",
	music: "Music",
	other: "Other",
};

export const featureLabels: Record<FeatureFlag, string> = {
	site: "Site",
	rsvp: "RSVP",
	gifts: "Gifts",
	photos: "Album",
	liveWall: "Live wall",
	seating: "Seating",
	messaging: "WhatsApp",
};

export const coupleStatuses: CoupleStatus[] = [
	"new",
	"talking",
	"option",
	"confirmed",
	"day-of",
	"wrapped",
	"lost",
];
export const leadStatuses: CoupleStatus[] = ["new", "talking", "option", "lost"];
export const clientStatuses: CoupleStatus[] = ["confirmed", "day-of", "wrapped"];

export function isLeadStatus(status: CoupleStatus): boolean {
	return (leadStatuses as CoupleStatus[]).includes(status);
}

export function isClientStatus(status: CoupleStatus): boolean {
	return (clientStatuses as CoupleStatus[]).includes(status);
}

export function coupleLane(status: CoupleStatus): "lead" | "client" {
	return isClientStatus(status) ? "client" : "lead";
}
export const providerKinds: ProviderKind[] = [
	"venue",
	"kitchen",
	"flowers",
	"photo",
	"music",
	"other",
];

export function pipelineValue(row: Couple): number {
	return row.fee + (row.bookedVendorTotal - row.ourCost);
}

export function slugId(value: string): string {
	const slug = value
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^\w\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.slice(0, 48);
	return slug || `id-${Date.now().toString(36)}`;
}

export function threadIdFor(channel: Channel, handle: string): string {
	return slugId(`${channel}-${handle}`);
}

/*
 * Lives here rather than in `inbox.ts` because ContactLinks runs in the
 * browser and `inbox.ts` reaches the store. `to` and `name` let the inbox
 * open a compose pane when we have never written to this address before.
 */
export function threadHref(channel: Channel, handle: string, name?: string): string {
	const params = new URLSearchParams({ thread: threadIdFor(channel, handle), to: handle });
	if (name) params.set("name", name);
	return `/inbox?${params.toString()}`;
}

export function whatsappHref(number: string): string {
	const digits = number.replace(/[^\d]/g, "");
	return `https://wa.me/${digits}`;
}

export function telHref(number: string): string {
	return `tel:${number.replace(/\s+/g, "")}`;
}

export function matchesQuery(haystack: string, query: string): boolean {
	if (!query.trim()) return true;
	return haystack.toLowerCase().includes(query.trim().toLowerCase());
}

export function filterCouples(
	couples: Couple[],
	filters: { q?: string; status?: string; place?: string; lane?: "lead" | "client" }
): Couple[] {
	return couples.filter((row) => {
		if (filters.lane === "lead" && !isLeadStatus(row.status)) return false;
		if (filters.lane === "client" && !isClientStatus(row.status)) return false;
		if (filters.status && filters.status !== "all" && row.status !== filters.status) return false;
		if (filters.place && filters.place !== "all" && row.place.label !== filters.place) {
			return false;
		}
		const blob = `${row.couple} ${row.place.label} ${row.notes ?? ""} ${row.source ?? ""} ${row.domain ?? ""}`;
		return matchesQuery(blob, filters.q ?? "");
	});
}

export function filterProviders(
	providers: Provider[],
	filters: { q?: string; kind?: string; place?: string }
): Provider[] {
	return providers.filter((provider) => {
		if (filters.kind && filters.kind !== "all" && provider.kind !== filters.kind) return false;
		if (filters.place && filters.place !== "all" && provider.place.label !== filters.place) {
			return false;
		}
		const blob = `${provider.name} ${provider.place.label} ${provider.notes ?? ""} ${provider.tags.join(" ")} ${provider.contact.phone ?? ""}`;
		return matchesQuery(blob, filters.q ?? "");
	});
}

export function uniquePlaces(rows: { place: Place }[]): string[] {
	return [...new Set(rows.map((row) => row.place.label))].sort((a, b) => a.localeCompare(b));
}
