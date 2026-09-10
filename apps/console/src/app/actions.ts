"use server";

import { revalidatePath } from "next/cache";
import { sendOutbound } from "@/lib/channels";
import type { Channel, Couple, CoupleStatus, FeatureFlag, Provider, ProviderKind } from "@/lib/crm";
import { slugId } from "@/lib/crm";
import { geocodePlace } from "@/lib/geocode";
import { threadIdFor } from "@/lib/inbox";
import {
	appendMessage,
	getCouple,
	getThread,
	markThreadRead,
	setCoupleStatus,
	upsertCouple,
	upsertProvider,
	upsertThread,
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

export async function saveCouple(form: FormData): Promise<Couple | undefined> {
	const names = text(form, "couple");
	if (!names) return undefined;
	const existing = text(form, "id") ? await getCouple(text(form, "id")) : undefined;
	const place = await resolvePlace(text(form, "place"), text(form, "address"));
	const features = text(form, "features");
	const row: Couple = {
		id: existing?.id || slugId(names),
		couple: names,
		place,
		date: text(form, "date") || undefined,
		status: (text(form, "status") as CoupleStatus) || existing?.status || "new",
		source: text(form, "source") || existing?.source,
		contact: {
			email: text(form, "email") || undefined,
			phone: text(form, "phone") || undefined,
			whatsapp: text(form, "whatsapp") || undefined,
			instagram: text(form, "instagram") || existing?.contact.instagram,
		},
		notes: text(form, "notes") || undefined,
		createdAt: text(form, "createdAt") || existing?.createdAt || new Date().toISOString(),
		domain: text(form, "domain") || existing?.domain,
		guestOrigin: text(form, "guestOrigin") || existing?.guestOrigin,
		fee: text(form, "fee") ? number(form, "fee") : (existing?.fee ?? 0),
		budget: text(form, "budget") ? number(form, "budget") : (existing?.budget ?? 0),
		bookedVendorTotal: text(form, "bookedVendorTotal")
			? number(form, "bookedVendorTotal")
			: (existing?.bookedVendorTotal ?? 0),
		ourCost: text(form, "ourCost") ? number(form, "ourCost") : (existing?.ourCost ?? 0),
		features: features
			? (features.split(",") as FeatureFlag[])
			: (existing?.features ?? ["site", "rsvp"]),
		providerIds: text(form, "providerIds")
			? text(form, "providerIds").split(",")
			: (existing?.providerIds ?? []),
	};
	await upsertCouple(row);
	revalidateCrm();
	return row;
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
		rating: Number(text(form, "rating")) || undefined,
		reviewCount: Number(text(form, "reviewCount")) || undefined,
		reviewsUrl: text(form, "reviewsUrl") || undefined,
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

export async function moveCouple(id: string, status: CoupleStatus): Promise<void> {
	await setCoupleStatus(id, status);
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

/*
 * Opening a first email to somebody we have never written to. Clicking an
 * address anywhere in the console lands on the inbox with `to` set, and this
 * is what turns that into a real thread on send — so a first email is written
 * in the same place as every reply, rather than handing off to a mail client.
 */
export async function startThread(form: FormData): Promise<void> {
	const handle = text(form, "handle");
	const body = text(form, "body");
	if (!handle || !body) return;
	const channel = (text(form, "channel") as Channel) || "email";
	const subject = text(form, "subject") || undefined;
	const id = threadIdFor(channel, handle);

	if (!(await getThread(id))) {
		await upsertThread({
			id,
			channel,
			subject,
			contactName: text(form, "name") || handle,
			handle,
			unread: false,
			messages: [],
		});
	}

	await sendOutbound({ channel, handle, subject, body });
	await appendMessage(
		id,
		{
			id: `out-${Date.now().toString(36)}`,
			direction: "out",
			channel,
			body,
			at: new Date().toISOString(),
		},
		false
	);
	revalidateCrm();
}
