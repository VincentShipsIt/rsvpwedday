export type FeatureFlag =
	| "site"
	| "rsvp"
	| "gifts"
	| "photos"
	| "liveWall"
	| "seating"
	| "messaging";

export type LeadStage = "new" | "talking" | "option" | "booked" | "lost";
export type ClientStatus = "option" | "confirmed" | "day-of" | "wrapped";
export type ProviderKind = "venue" | "kitchen" | "flowers" | "photo" | "music" | "other";

export type Contact = {
	email?: string;
	phone?: string;
	whatsapp?: string;
};

export type Place = {
	label: string;
	address?: string;
	lat?: number;
	lng?: number;
};

export type Lead = {
	id: string;
	couple: string;
	place: Place;
	date?: string;
	stage: LeadStage;
	source?: string;
	contact: Contact;
	notes?: string;
	createdAt: string;
};

export type Client = {
	id: string;
	couple: string;
	place: Place;
	date: string;
	domain?: string;
	guestOrigin?: string;
	fee: number;
	budget: number;
	bookedVendorTotal: number;
	ourCost: number;
	status: ClientStatus;
	features: FeatureFlag[];
	contact: Contact;
	notes?: string;
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
	tags: string[];
};

export type CrmData = {
	leads: Lead[];
	clients: Client[];
	providers: Provider[];
};

export const euro = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 0,
});

export const leadStageLabels: Record<LeadStage, string> = {
	new: "New",
	talking: "Talking",
	option: "Option",
	booked: "Booked",
	lost: "Lost",
};

export const clientStatusLabels: Record<ClientStatus, string> = {
	option: "Option",
	confirmed: "Confirmed",
	"day-of": "Day-of",
	wrapped: "Wrapped",
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

export const leadStages: LeadStage[] = ["new", "talking", "option", "booked", "lost"];
export const clientStatuses: ClientStatus[] = ["option", "confirmed", "day-of", "wrapped"];
export const providerKinds: ProviderKind[] = [
	"venue",
	"kitchen",
	"flowers",
	"photo",
	"music",
	"other",
];

export function pipelineValue(client: Client): number {
	return client.fee + (client.bookedVendorTotal - client.ourCost);
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

export function filterLeads(
	leads: Lead[],
	filters: { q?: string; stage?: string; place?: string }
): Lead[] {
	return leads.filter((lead) => {
		if (filters.stage && filters.stage !== "all" && lead.stage !== filters.stage) return false;
		if (filters.place && filters.place !== "all" && lead.place.label !== filters.place) {
			return false;
		}
		const blob = `${lead.couple} ${lead.place.label} ${lead.notes ?? ""} ${lead.source ?? ""}`;
		return matchesQuery(blob, filters.q ?? "");
	});
}

export function filterClients(
	clients: Client[],
	filters: { q?: string; status?: string; place?: string }
): Client[] {
	return clients.filter((client) => {
		if (filters.status && filters.status !== "all" && client.status !== filters.status) {
			return false;
		}
		if (filters.place && filters.place !== "all" && client.place.label !== filters.place) {
			return false;
		}
		const blob = `${client.couple} ${client.place.label} ${client.domain ?? ""} ${client.notes ?? ""}`;
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
