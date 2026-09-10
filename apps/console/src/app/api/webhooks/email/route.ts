import { revalidatePath } from "next/cache";
import { fetchReceivedEmail } from "@/lib/channels";
import { ingestInbound } from "@/lib/inbox";

export const runtime = "nodejs";

type ReceivedEvent = {
	type?: string;
	data?: {
		email_id?: string;
		from?: string;
		subject?: string;
	};
};

function parseFrom(from: string): string {
	const angle = from.match(/<([^>]+)>/);
	return (angle?.[1] ?? from).trim();
}

export async function POST(request: Request): Promise<Response> {
	const event = (await request.json()) as ReceivedEvent;
	if (event.type && event.type !== "email.received") {
		return Response.json({ ignored: true });
	}
	const emailId = event.data?.email_id;
	let handle = event.data?.from ? parseFrom(event.data.from) : "";
	let subject = event.data?.subject;
	let body = "";
	if (emailId && process.env.RESEND_API_KEY) {
		const email = await fetchReceivedEmail(emailId);
		handle = parseFrom(email.from) || handle;
		subject = email.subject ?? subject;
		body = email.text;
	}
	if (!body) body = subject ?? "";
	if (!handle || !body) {
		return Response.json({ ignored: true, reason: "empty" }, { status: 202 });
	}
	await ingestInbound({ channel: "email", handle, subject, body });
	revalidatePath("/inbox");
	return Response.json({ ok: true });
}
