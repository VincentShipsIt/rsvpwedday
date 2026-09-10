import { revalidatePath } from "next/cache";
import { ingestInbound } from "@/lib/inbox";

export const runtime = "nodejs";

type InstagramPayload = {
	object?: string;
	entry?: Array<{
		messaging?: Array<{
			sender?: { id?: string };
			message?: { text?: string };
			timestamp?: number;
		}>;
	}>;
};

export async function GET(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const mode = url.searchParams.get("hub.mode");
	const token = url.searchParams.get("hub.verify_token");
	const challenge = url.searchParams.get("hub.challenge");
	if (mode === "subscribe" && token && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
		return new Response(challenge ?? "", { status: 200 });
	}
	return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request): Promise<Response> {
	const payload = (await request.json()) as InstagramPayload;
	const events = payload.entry?.flatMap((entry) => entry.messaging ?? []) ?? [];
	for (const event of events) {
		const handle = event.sender?.id;
		const body = event.message?.text;
		if (!handle || !body) continue;
		await ingestInbound({
			channel: "instagram",
			handle,
			body,
			at: event.timestamp ? new Date(event.timestamp).toISOString() : undefined,
		});
	}
	revalidatePath("/inbox");
	return Response.json({ ok: true });
}
