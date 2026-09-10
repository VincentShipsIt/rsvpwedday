"use server";

import { revalidatePath } from "next/cache";
import { sendOutbound } from "@/lib/channels";
import type { Client, ClientStatus, Lead, LeadStage, Provider, ProviderKind } from "@/lib/crm";
import { slugId } from "@/lib/crm";
import { geocodePlace } from "@/lib/geocode";
import {
	appendMessage,
	getThread,
	markThreadRead,
	setClientStatus,
	setLeadStage,
	upsertClient,
	upsertLead,
	upsertProvider,
} from "@/lib/store";

function text(form: FormData, key: string): string {
	return String(form.get(key) ?? "").trim();
}

function number(form: FormData, key: string): number {
	const value = Number(text(form, key));
	return Number.isFinite(value) ? value : 0;
}

async function resolvePlace(label: string, address: string) {
	const query = address || label;
	const geo = query ? await geocodePlace(query) : null;
	return geo ?? { label: label || query, address: address || undefined };
}

function revalidateCrm(): void {
	revalidatePath("/", "layout");
}

export async function saveLead(form: FormData): Promise<void> {
	const couple = text(form, "couple");
	if (!couple) return;
	const place = await resolvePlace(text(form, "place"), text(form, "address"));
	const lead: Lead = {
		id: text(form, "id") || slugId(couple),
		couple,
		place,
		date: text(form, "date") || undefined,
		stage: (text(form, "stage") as LeadStage) || "new",
		source: text(form, "source") || undefined,
		contact: {
			email: text(form, "email") || undefined,
			phone: text(form, "phone") || undefined,
			whatsapp: text(form, "whatsapp") || undefined,
		},
		notes: text(form, "notes") || undefined,
		createdAt: text(form, "createdAt") || new Date().toISOString(),
	};
	await upsertLead(lead);
	revalidateCrm();
}

export async function saveClient(form: FormData): Promise<void> {
	const couple = text(form, "couple");
	if (!couple) return;
	const place = await resolvePlace(text(form, "place"), text(form, "address"));
	const existingFeatures = text(form, "features");
	const client: Client = {
		id: text(form, "id") || slugId(couple),
		couple,
		place,
		date: text(form, "date") || new Date().toISOString().slice(0, 10),
		domain: text(form, "domain") || undefined,
		guestOrigin: text(form, "guestOrigin") || undefined,
		fee: number(form, "fee"),
		budget: number(form, "budget"),
		bookedVendorTotal: number(form, "bookedVendorTotal"),
		ourCost: number(form, "ourCost"),
		status: (text(form, "status") as ClientStatus) || "option",
		features: existingFeatures
			? (existingFeatures.split(",") as Client["features"])
			: ["site", "rsvp"],
		contact: {
			email: text(form, "email") || undefined,
			phone: text(form, "phone") || undefined,
			whatsapp: text(form, "whatsapp") || undefined,
		},
		notes: text(form, "notes") || undefined,
		providerIds: text(form, "providerIds") ? text(form, "providerIds").split(",") : [],
	};
	await upsertClient(client);
	revalidateCrm();
}

export async function saveProvider(form: FormData): Promise<void> {
	const name = text(form, "name");
	if (!name) return;
	const placeLabel = text(form, "place");
	const address = text(form, "address");
	const place = await resolvePlace(placeLabel, address || `${name}, ${placeLabel}`);
	const provider: Provider = {
		id: text(form, "id") || slugId(name),
		name,
		kind: (text(form, "kind") as ProviderKind) || "other",
		place,
		contact: {
			email: text(form, "email") || undefined,
			phone: text(form, "phone") || undefined,
			whatsapp: text(form, "whatsapp") || undefined,
		},
		website: text(form, "website") || undefined,
		instagram: text(form, "instagram") || undefined,
		hours: text(form, "hours") || undefined,
		capacity: text(form, "capacity") || undefined,
		notes: text(form, "notes") || undefined,
		tags: text(form, "tags")
			? text(form, "tags")
					.split(",")
					.map((tag) => tag.trim())
					.filter(Boolean)
			: [],
	};
	await upsertProvider(provider);
	revalidateCrm();
}

export async function moveLead(id: string, stage: LeadStage): Promise<void> {
	await setLeadStage(id, stage);
	revalidateCrm();
}

export async function moveClient(id: string, status: ClientStatus): Promise<void> {
	await setClientStatus(id, status);
	revalidateCrm();
}

export async function openThread(id: string): Promise<void> {
	await markThreadRead(id);
	revalidateCrm();
}

export async function replyToThread(form: FormData): Promise<void> {
	const threadId = text(form, "threadId");
	const body = text(form, "body");
	if (!threadId || !body) return;
	const thread = await getThread(threadId);
	if (!thread) return;
	await sendOutbound({
		channel: thread.channel,
		handle: thread.handle,
		subject: thread.subject,
		body,
	});
	await appendMessage(
		threadId,
		{
			id: `out-${Date.now().toString(36)}`,
			direction: "out",
			channel: thread.channel,
			body,
			at: new Date().toISOString(),
		},
		false
	);
	revalidateCrm();
}
