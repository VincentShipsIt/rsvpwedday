"use client";

import { Button } from "@rsvpwedday/ui/button";
import { Input } from "@rsvpwedday/ui/input";
import { Label } from "@rsvpwedday/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Message = { id: string; role: "user" | "assistant"; content: string };
type Action = { id: string; name: string; summary: string; payload: Record<string, unknown> };

/*
 * Two rules make this a collaboration rather than an autopilot: the agent
 * never writes without a human pressing Confirm, and every proposed write is
 * stated in a sentence a person can check before they press it.
 */
export function AgentChat() {
	const router = useRouter();
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "intro",
			role: "assistant",
			content:
				"Ask me about the studio, or tell me what changed. “Add Trattoria Luna in Victoria, kitchen, WhatsApp +356 9922 3344” or “New lead Sofia in Gozo for October.” I draft; you confirm before anything is saved.",
		},
	]);
	const [draft, setDraft] = useState("");
	const [pending, setPending] = useState<Action[]>([]);
	const [busy, setBusy] = useState(false);

	async function send(payload: Record<string, unknown>) {
		setBusy(true);
		try {
			const response = await fetch("/api/agent", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const body = (await response.json()) as { content: string; actions: Action[] };
			setMessages((current) => [
				...current,
				{ id: crypto.randomUUID(), role: "assistant", content: body.content },
			]);
			setPending(body.actions ?? []);
			if (payload.confirm) router.refresh();
		} catch {
			setMessages((current) => [
				...current,
				{
					id: crypto.randomUUID(),
					role: "assistant",
					content: "I could not reach OpenRouter just now. Nothing was saved.",
				},
			]);
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
				<ul className="flex flex-col gap-4">
					{messages.map((message) => (
						<li key={message.id} className="flex flex-col gap-1">
							<p className="text-muted-foreground text-[11px] font-medium">
								{message.role === "user" ? "You" : "Agent"}
							</p>
							<p
								className={
									message.role === "user"
										? "text-[13px] text-pretty"
										: "bg-card rounded-md border px-3 py-2 text-[13px] text-pretty"
								}
							>
								{message.content}
							</p>
						</li>
					))}
				</ul>

				{pending.length > 0 ? (
					<div className="mt-5 flex flex-col gap-2">
						<p className="text-muted-foreground text-[11px] font-medium">
							Waiting for you — nothing is saved yet
						</p>
						{pending.map((action) => (
							<div
								key={action.id}
								className="bg-card flex flex-col gap-2.5 rounded-md border p-3 text-[13px]"
							>
								<p className="text-pretty">{action.summary}</p>
								<div className="flex gap-2">
									<Button
										size="sm"
										disabled={busy}
										onClick={() =>
											void send({ confirm: { name: action.name, payload: action.payload } })
										}
									>
										Confirm
									</Button>
									<Button size="sm" variant="ghost" onClick={() => setPending([])}>
										Discard
									</Button>
								</div>
							</div>
						))}
					</div>
				) : null}
			</div>

			<form
				className="flex shrink-0 gap-2 border-t p-3"
				onSubmit={(event) => {
					event.preventDefault();
					const text = draft.trim();
					if (!text || busy) return;
					const next = [
						...messages,
						{ id: crypto.randomUUID(), role: "user" as const, content: text },
					];
					setMessages(next);
					setDraft("");
					void send({ messages: next.map(({ role, content }) => ({ role, content })) });
				}}
			>
				<Label htmlFor="agent-draft" className="sr-only">
					Ask the agent
				</Label>
				<Input
					id="agent-draft"
					className="min-w-0 flex-1"
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					placeholder="Add a kitchen in Victoria…"
					disabled={busy}
				/>
				<Button type="submit" disabled={busy}>
					{busy ? "…" : "Send"}
				</Button>
			</form>
		</div>
	);
}
