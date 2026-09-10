export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "openrouter/free";

export function openRouterConfigured(): boolean {
	return Boolean(process.env.OPENROUTER_API_KEY);
}

export type ChatMessage = {
	role: "system" | "user" | "assistant" | "tool";
	content: string;
	tool_call_id?: string;
};

export type ToolCall = {
	id: string;
	type: "function";
	function: { name: string; arguments: string };
};

type OpenRouterResponse = {
	choices?: Array<{
		message?: {
			role?: string;
			content?: string | null;
			tool_calls?: ToolCall[];
		};
	}>;
	error?: { message?: string };
};

export async function chatWithTools(input: {
	messages: ChatMessage[];
	tools: unknown[];
}): Promise<{ content: string; toolCalls: ToolCall[] }> {
	const key = process.env.OPENROUTER_API_KEY;
	if (!key) {
		throw new Error("OPENROUTER_API_KEY is not set.");
	}
	const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${key}`,
			"Content-Type": "application/json",
			"HTTP-Referer": process.env.APP_URL ?? "http://localhost:3011",
			"X-Title": "Say Yes console",
		},
		body: JSON.stringify({
			model: OPENROUTER_MODEL,
			messages: input.messages,
			tools: input.tools,
			tool_choice: "auto",
		}),
	});
	const body = (await response.json()) as OpenRouterResponse;
	if (!response.ok) {
		throw new Error(body.error?.message ?? `OpenRouter ${response.status}`);
	}
	const message = body.choices?.[0]?.message;
	return {
		content: message?.content ?? "",
		toolCalls: message?.tool_calls ?? [],
	};
}
