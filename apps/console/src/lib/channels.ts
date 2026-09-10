import type { Channel } from "@/lib/crm";

export function channelStatus(): Record<Channel, boolean> {
	return {
		email: Boolean(process.env.RESEND_API_KEY),
		instagram: Boolean(process.env.META_PAGE_ACCESS_TOKEN),
		whatsapp: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID),
	};
}

export async function sendOutbound(input: {
	channel: Channel;
	handle: string;
	subject?: string;
	body: string;
}): Promise<{ delivered: boolean; note: string }> {
	if (input.channel === "email") {
		const key = process.env.RESEND_API_KEY;
		const from = process.env.EMAIL_FROM ?? "Say Yes <studio@sayyess.com>";
		if (!key) {
			return { delivered: false, note: "Saved in the inbox. Set RESEND_API_KEY to send." };
		}
		const response = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${key}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from,
				to: [input.handle],
				subject: input.subject || "Say Yes",
				text: input.body,
			}),
		});
		if (!response.ok) {
			const text = await response.text();
			throw new Error(text || `Resend ${response.status}`);
		}
		return { delivered: true, note: "Sent by email." };
	}

	if (input.channel === "instagram") {
		const token = process.env.META_PAGE_ACCESS_TOKEN;
		if (!token) {
			return {
				delivered: false,
				note: "Saved in the inbox. Set META_PAGE_ACCESS_TOKEN to send Instagram DMs.",
			};
		}
		const response = await fetch(
			`https://graph.facebook.com/v21.0/me/messages?access_token=${token}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					recipient: { id: input.handle },
					message: { text: input.body },
				}),
			}
		);
		if (!response.ok) {
			const text = await response.text();
			throw new Error(text || `Instagram ${response.status}`);
		}
		return { delivered: true, note: "Sent on Instagram." };
	}

	const token = process.env.WHATSAPP_TOKEN;
	const phoneId = process.env.WHATSAPP_PHONE_ID;
	if (!token || !phoneId) {
		return {
			delivered: false,
			note: "Saved in the inbox. Set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID to send.",
		};
	}
	const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			messaging_product: "whatsapp",
			to: input.handle.replace(/[^\d]/g, ""),
			type: "text",
			text: { body: input.body },
		}),
	});
	if (!response.ok) {
		const text = await response.text();
		throw new Error(text || `WhatsApp ${response.status}`);
	}
	return { delivered: true, note: "Sent on WhatsApp." };
}

export async function fetchReceivedEmail(emailId: string): Promise<{
	from: string;
	subject?: string;
	text: string;
}> {
	const key = process.env.RESEND_API_KEY;
	if (!key) throw new Error("RESEND_API_KEY is not set.");
	const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
		headers: { Authorization: `Bearer ${key}` },
	});
	if (!response.ok) throw new Error(`Resend receiving ${response.status}`);
	const body = (await response.json()) as {
		from?: string;
		subject?: string;
		text?: string;
		html?: string;
	};
	return {
		from: body.from ?? "",
		subject: body.subject,
		text: body.text || stripHtml(body.html ?? ""),
	};
}

function stripHtml(html: string): string {
	return html
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}
