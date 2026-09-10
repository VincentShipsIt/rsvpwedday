import type { CoupleStatus, FeatureFlag, ProviderKind } from "@/lib/crm";
import { isClientStatus, slugId } from "@/lib/crm";
import { geocodePlace } from "@/lib/geocode";
import { getCrm, upsertCouple, upsertProvider } from "@/lib/store";

export type ProposedAction = {
	id: string;
	name: string;
	summary: string;
	payload: Record<string, unknown>;
};

export const agentTools = [
	{
		type: "function",
		function: {
			name: "create_lead",
			description: "Create a new lead (enquiry not yet booked).",
			parameters: {
				type: "object",
				properties: {
					couple: { type: "string" },
					place: { type: "string", description: "City or island" },
					date: { type: "string", description: "ISO date YYYY-MM-DD if known" },
					stage: { type: "string", enum: ["new", "talking", "option", "booked", "lost"] },
					email: { type: "string" },
					phone: { type: "string" },
					whatsapp: { type: "string" },
					source: { type: "string" },
					notes: { type: "string" },
				},
				required: ["couple", "place"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "create_client",
			description: "Create a booked client wedding.",
			parameters: {
				type: "object",
				properties: {
					couple: { type: "string" },
					place: { type: "string" },
					date: { type: "string" },
					fee: { type: "number" },
					budget: { type: "number" },
					status: { type: "string", enum: ["option", "confirmed", "day-of", "wrapped"] },
					email: { type: "string" },
					phone: { type: "string" },
					whatsapp: { type: "string" },
					notes: { type: "string" },
				},
				required: ["couple", "place", "date"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "create_provider",
			description: "Create a venue, kitchen, florist, photographer, or other provider.",
			parameters: {
				type: "object",
				properties: {
					name: { type: "string" },
					kind: {
						type: "string",
						enum: ["venue", "kitchen", "flowers", "photo", "music", "other"],
					},
					place: { type: "string" },
					address: { type: "string" },
					phone: { type: "string" },
					whatsapp: { type: "string" },
					email: { type: "string" },
					website: { type: "string" },
					instagram: { type: "string" },
					capacity: { type: "string" },
					notes: { type: "string" },
				},
				required: ["name", "kind", "place"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "list_crm",
			description: "Read current leads, clients and providers. Use before answering questions.",
			parameters: { type: "object", properties: {} },
		},
	},
] as const;

export function summarizeToolCall(name: string, args: Record<string, unknown>): string {
	if (name === "create_lead") return `Create lead ${String(args.couple)} in ${String(args.place)}`;
	if (name === "create_client") {
		return `Create client ${String(args.couple)} — ${String(args.place)} ${String(args.date)}`;
	}
	if (name === "create_provider") {
		return `Save ${String(args.kind)} ${String(args.name)} in ${String(args.place)}`;
	}
	if (name === "list_crm") return "Read the CRM";
	return name;
}

export async function applyAction(name: string, args: Record<string, unknown>): Promise<string> {
	if (name === "list_crm") {
		const data = await getCrm();
		return JSON.stringify({
			couples: data.couples.map((row) => ({
				id: row.id,
				couple: row.couple,
				status: row.status,
				lane: isClientStatus(row.status) ? "client" : "lead",
				place: row.place.label,
				date: row.date,
				fee: row.fee,
			})),
			providers: data.providers.map((row) => ({
				id: row.id,
				name: row.name,
				kind: row.kind,
				place: row.place.label,
				phone: row.contact.phone,
			})),
		});
	}
	if (name === "create_lead" || name === "create_client") {
		const names = String(args.couple);
		const placeQuery = String(args.place);
		const geo = await geocodePlace(String(args.address ?? placeQuery));
		const status =
			name === "create_client"
				? ((args.status as CoupleStatus) ?? "confirmed")
				: ((args.stage as CoupleStatus) ?? "new");
		const row = await upsertCouple({
			id: slugId(names),
			couple: names,
			place: geo ?? { label: placeQuery },
			date: args.date ? String(args.date) : undefined,
			status: status === "booked" ? "confirmed" : status,
			source: args.source ? String(args.source) : "Agent",
			contact: {
				email: args.email ? String(args.email) : undefined,
				phone: args.phone ? String(args.phone) : undefined,
				whatsapp: args.whatsapp ? String(args.whatsapp) : undefined,
			},
			notes: args.notes ? String(args.notes) : undefined,
			createdAt: new Date().toISOString(),
			fee: Number(args.fee ?? 0),
			budget: Number(args.budget ?? 0),
			bookedVendorTotal: 0,
			ourCost: 0,
			features: ["site", "rsvp"] as FeatureFlag[],
			providerIds: [],
		});
		return `Saved couple ${row.couple} (${row.status})`;
	}
	if (name === "create_provider") {
		const nameValue = String(args.name);
		const placeQuery = String(args.place);
		const geo = await geocodePlace(String(args.address ?? `${nameValue}, ${placeQuery}`));
		const provider = await upsertProvider({
			id: slugId(nameValue),
			name: nameValue,
			kind: (args.kind as ProviderKind) ?? "other",
			place: geo ?? { label: placeQuery, address: args.address ? String(args.address) : undefined },
			contact: {
				email: args.email ? String(args.email) : undefined,
				phone: args.phone ? String(args.phone) : undefined,
				whatsapp: args.whatsapp ? String(args.whatsapp) : undefined,
			},
			website: args.website ? String(args.website) : undefined,
			instagram: args.instagram ? String(args.instagram) : undefined,
			capacity: args.capacity ? String(args.capacity) : undefined,
			notes: args.notes ? String(args.notes) : undefined,
			tags: [],
		});
		return `Saved provider ${provider.name}`;
	}
	throw new Error(`Unknown action ${name}`);
}
