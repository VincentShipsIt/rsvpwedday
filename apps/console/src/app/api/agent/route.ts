import { revalidatePath } from "next/cache";
import { agentTools, applyAction, summarizeToolCall } from "@/lib/agent-tools";
import { type ChatMessage, chatWithTools, openRouterConfigured } from "@/lib/openrouter";

export const runtime = "nodejs";

type Incoming = {
	messages: Array<{ role: "user" | "assistant"; content: string }>;
	confirm?: { name: string; payload: Record<string, unknown> };
};

export async function POST(request: Request): Promise<Response> {
	const body = (await request.json()) as Incoming;
	if (body.confirm) {
		const result = await applyAction(body.confirm.name, body.confirm.payload);
		revalidatePath("/", "layout");
		return Response.json({ content: result, actions: [] });
	}

	if (!openRouterConfigured()) {
		return Response.json({
			content:
				"Set OPENROUTER_API_KEY in apps/console/.env.local to talk to a free model. Until then, use the forms on Leads, Clients and Providers — saving a kitchen still geocodes the address and keeps phone / WhatsApp.",
			actions: [],
			configured: false,
		});
	}

	const snapshot = await applyAction("list_crm", {});
	const system: ChatMessage = {
		role: "system",
		content: `You are the Say Yes planning console agent. You manage the studio CRM: leads, booked clients, and providers (venues, kitchens, florists, photographers). Never invent a write. When the user wants to save something, call a create_* tool. Those writes wait for Vincent to confirm. Speak briefly. Money is EUR.
Current CRM JSON:
${snapshot}`,
	};

	const messages: ChatMessage[] = [
		system,
		...body.messages.map((message) => ({ role: message.role, content: message.content })),
	];

	const turn = await chatWithTools({ messages, tools: [...agentTools] });
	const proposed = turn.toolCalls
		.filter((call) => call.function.name !== "list_crm")
		.map((call) => {
			const args = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
			return {
				id: call.id,
				name: call.function.name,
				summary: summarizeToolCall(call.function.name, args),
				payload: args,
			};
		});

	return Response.json({
		content:
			turn.content ||
			(proposed.length > 0 ? "Draft only — confirm to write these into the CRM." : ""),
		actions: proposed,
		configured: true,
	});
}
