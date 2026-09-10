"use client";

import { Button } from "@rsvpwedday/ui/button";
import { Card, CardContent, CardFooter } from "@rsvpwedday/ui/card";
import { Input } from "@rsvpwedday/ui/input";
import { Label } from "@rsvpwedday/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Message = { id: string; role: "user" | "assistant"; content: string };
type Action = { id: string; name: string; summary: string; payload: Record<string, unknown> };

export function AgentChat() {
	const router = useRouter();
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "intro",
			role: "assistant",
			content:
				"Talk to the CRM. “Add Trattoria Luna in Victoria, kitchen, WhatsApp +356 9922 3344” or “New lead Sofia in Gozo for October.” Writes wait for your confirm.",
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
			const body = (await response.json()) as {
				content: string;
				actions: Action[];
			};
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
					content: "The agent could not reach OpenRouter.",
				},
			]);
		} finally {
			setBusy(false);
		}
	}

	return (
		<Card className="max-w-3xl">
			<CardContent className="pt-(--card-spacing)">
				<ul className="flex flex-col gap-5">
					{messages.map((message) => (
						<li key={message.id}>
							<p className="text-muted-foreground text-xs font-medium">
								{message.role === "user" ? "You" : "Agent"}
							</p>
							<p className="mt-1 font-serif text-pretty">{message.content}</p>
						</li>
					))}
				</ul>
				{pending.length > 0 ? (
					<ul className="mt-6 flex flex-col gap-2">
						{pending.map((action) => (
							<li
								key={action.id}
								className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sand px-3 py-2 text-sm"
							>
								<p>{action.summary}</p>
								<div className="flex gap-2">
									<Button
										size="sm"
										disabled={busy}
										onClick={() =>
											void send({
												confirm: { name: action.name, payload: action.payload },
											})
										}
									>
										Confirm
									</Button>
									<Button size="sm" variant="outline" onClick={() => setPending([])}>
										Discard
									</Button>
								</div>
							</li>
						))}
					</ul>
				) : null}
			</CardContent>
			<CardFooter>
				<form
					className="flex w-full gap-2"
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
						void send({
							messages: next.map(({ role, content }) => ({ role, content })),
						});
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
			</CardFooter>
		</Card>
	);
}
