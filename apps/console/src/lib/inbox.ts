import type { Channel, CrmData, InboxMessage, Thread, ThreadPersonKind } from "@/lib/crm";
import { threadIdFor } from "@/lib/crm";

export { threadIdFor };

import { appendMessage, getCrm, upsertThread } from "@/lib/store";

export function lastMessage(thread: Thread) {
	return thread.messages.at(-1);
}

export function sortThreads(threads: Thread[]): Thread[] {
	return [...threads].sort((a, b) => {
		const aAt = lastMessage(a)?.at ?? "";
		const bAt = lastMessage(b)?.at ?? "";
		return bAt.localeCompare(aAt);
	});
}

export function filterThreads(threads: Thread[], channel?: string): Thread[] {
	if (!channel || channel === "all") return sortThreads(threads);
	return sortThreads(threads.filter((thread) => thread.channel === channel));
}

export function personHref(thread: Thread): string | null {
	if (!thread.personId || !thread.personKind) return null;
	if (thread.personKind === "provider") return `/providers/${thread.personId}`;
	return `/couples/${thread.personId}`;
}

export function matchPerson(
	data: CrmData,
	channel: Channel,
	handle: string
): { personId: string; personKind: ThreadPersonKind; contactName: string } | null {
	const needle = handle.trim().toLowerCase().replace(/^@/, "");
	for (const row of data.couples) {
		if (matchesContact(channel, needle, row.contact, row.couple)) {
			return { personId: row.id, personKind: "couple", contactName: row.couple };
		}
	}
	for (const provider of data.providers) {
		const ig = provider.contact.instagram ?? provider.instagram;
		if (matchesContact(channel, needle, { ...provider.contact, instagram: ig }, provider.name)) {
			return { personId: provider.id, personKind: "provider", contactName: provider.name };
		}
	}
	return null;
}

function matchesContact(
	channel: Channel,
	needle: string,
	contact: { email?: string; phone?: string; whatsapp?: string; instagram?: string },
	name: string
): boolean {
	if (channel === "email") return contact.email?.toLowerCase() === needle;
	if (channel === "instagram") return contact.instagram?.toLowerCase().replace(/^@/, "") === needle;
	if (channel === "whatsapp") {
		const digits = needle.replace(/[^\d]/g, "");
		return (
			contact.whatsapp?.replace(/[^\d]/g, "") === digits ||
			contact.phone?.replace(/[^\d]/g, "") === digits
		);
	}
	return name.toLowerCase() === needle;
}

export async function ingestInbound(input: {
	channel: Channel;
	handle: string;
	body: string;
	subject?: string;
	at?: string;
}): Promise<Thread> {
	const data = await getCrm();
	const handle = input.handle.trim();
	const existing = data.threads.find(
		(thread) =>
			thread.channel === input.channel && thread.handle.toLowerCase() === handle.toLowerCase()
	);
	const message: InboxMessage = {
		id: `in-${Date.now().toString(36)}`,
		direction: "in",
		channel: input.channel,
		body: input.body,
		at: input.at ?? new Date().toISOString(),
	};
	if (existing) {
		const updated = await appendMessage(existing.id, message, true);
		if (!updated) throw new Error("Thread vanished");
		return updated;
	}
	const match = matchPerson(data, input.channel, handle);
	return upsertThread({
		id: threadIdFor(input.channel, handle),
		channel: input.channel,
		subject: input.subject,
		contactName: match?.contactName ?? handle,
		handle,
		personId: match?.personId,
		personKind: match?.personKind,
		unread: true,
		messages: [message],
	});
}
