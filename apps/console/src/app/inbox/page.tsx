import { Badge } from "@rsvpwedday/ui/badge";
import { Button } from "@rsvpwedday/ui/button";
import { Input } from "@rsvpwedday/ui/input";
import { Textarea } from "@rsvpwedday/ui/textarea";
import Link from "next/link";
import { replyToThread, startThread } from "@/app/actions";
import { ConsoleShell } from "@/components/console-shell";
import { channelStatus } from "@/lib/channels";
import { channelLabels, channels } from "@/lib/crm";
import { filterThreads, lastMessage, personHref } from "@/lib/inbox";
import { getThread, getThreads, markThreadRead } from "@/lib/store";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InboxPage({
	searchParams,
}: {
	searchParams: Promise<{ channel?: string; thread?: string; to?: string; name?: string }>;
}) {
	const params = await searchParams;
	const threads = filterThreads(await getThreads(), params.channel);
	const activeId = params.thread ?? threads[0]?.id;
	const active = activeId ? await getThread(activeId) : undefined;
	/* Arrived from an email address we have never written to — offer a compose
	   pane rather than an empty panel saying there are no threads. */
	const compose = !active && params.to ? { handle: params.to, name: params.name } : undefined;
	if (active?.unread) {
		await markThreadRead(active.id);
		active.unread = false;
	}
	const status = channelStatus();
	const unread = threads.filter((thread) => thread.unread).length;

	return (
		<ConsoleShell pathname="/inbox" fill>
			<div className="flex min-h-0 flex-1 flex-col">
				<header className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-6 py-5 lg:px-12">
					<div>
						<h1 className="text-3xl font-semibold tracking-tight">Inbox</h1>
						<p className="text-muted-foreground mt-1 text-sm">
							Email, Instagram DMs and WhatsApp in one place. Reply here — not in three apps.
							{unread ? ` ${unread} unread.` : ""}
						</p>
					</div>
					<ul className="flex flex-wrap gap-2 text-xs">
						{channels.map((channel) => (
							<li key={channel}>
								<Badge variant={status[channel] ? "default" : "outline"}>
									{channelLabels[channel]}
									{status[channel] ? " live" : " local"}
								</Badge>
							</li>
						))}
					</ul>
				</header>
				<div className="flex min-h-0 flex-1 flex-col md:flex-row">
					<aside className="flex w-full shrink-0 flex-col border-b border-border md:w-80 md:border-r md:border-b-0">
						<nav className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2">
							<ChannelLink href="/inbox" active={!params.channel || params.channel === "all"}>
								All
							</ChannelLink>
							{channels.map((channel) => (
								<ChannelLink
									key={channel}
									href={`/inbox?channel=${channel}`}
									active={params.channel === channel}
								>
									{channelLabels[channel]}
								</ChannelLink>
							))}
						</nav>
						<ul className="min-h-0 flex-1 overflow-y-auto">
							{threads.map((thread) => {
								const last = lastMessage(thread);
								const href = params.channel
									? `/inbox?channel=${params.channel}&thread=${thread.id}`
									: `/inbox?thread=${thread.id}`;
								return (
									<li key={thread.id}>
										<Link
											href={href}
											className={cn(
												"block border-b border-border px-4 py-3 hover:bg-accent",
												active?.id === thread.id && "bg-accent"
											)}
										>
											<p className="flex items-center justify-between gap-2">
												<span className="font-medium">{thread.contactName}</span>
												{thread.unread ? (
													<span className="bg-primary size-2 rounded-full">
														<span className="sr-only">Unread</span>
													</span>
												) : null}
											</p>
											<p className="text-muted-foreground mt-0.5 text-xs">
												{channelLabels[thread.channel]} · {thread.handle}
											</p>
											<p className="mt-1 line-clamp-2 text-sm">{last?.body ?? "No messages"}</p>
										</Link>
									</li>
								);
							})}
						</ul>
					</aside>
					<section className="flex min-h-0 min-w-0 flex-1 flex-col">
						{active ? (
							<>
								<header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-6 py-4">
									<div>
										<p className="text-lg font-semibold">{active.contactName}</p>
										<p className="text-muted-foreground text-xs">
											{channelLabels[active.channel]} · {active.handle}
											{active.subject ? ` · ${active.subject}` : ""}
										</p>
									</div>
									{personHref(active) ? (
										<Button variant="outline" size="sm" asChild>
											<Link href={personHref(active) ?? "/inbox"}>Open record</Link>
										</Button>
									) : null}
								</header>
								<ul className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
									{active.messages.map((message) => (
										<li
											key={message.id}
											className={cn(
												"max-w-xl rounded-xl px-4 py-3 text-sm",
												message.direction === "out"
													? "self-end bg-primary text-primary-foreground"
													: "self-start bg-card ring-1 ring-foreground/10"
											)}
										>
											<p className="text-pretty">{message.body}</p>
											<p
												className={cn(
													"mt-2 text-[11px]",
													message.direction === "out"
														? "text-primary-foreground/70"
														: "text-muted-foreground"
												)}
											>
												{message.direction === "out" ? "You" : active.contactName} ·{" "}
												{new Date(message.at).toLocaleString("en-GB", {
													day: "numeric",
													month: "short",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
										</li>
									))}
								</ul>
								<form action={replyToThread} className="border-t border-border px-6 py-4 pb-16">
									<input type="hidden" name="threadId" value={active.id} />
									<Textarea
										name="body"
										required
										placeholder={`Reply on ${channelLabels[active.channel]}…`}
										className="min-h-20"
									/>
									<div className="mt-2 flex items-center justify-between gap-3">
										<p className="text-muted-foreground text-xs">
											{status[active.channel]
												? `Sends on ${channelLabels[active.channel]}.`
												: `Stays in this inbox until ${channelLabels[active.channel]} is connected.`}
										</p>
										<Button type="submit">Send</Button>
									</div>
								</form>
							</>
						) : compose ? (
							<>
								<header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-6 py-4">
									<div>
										<p className="text-lg font-semibold">{compose.name ?? compose.handle}</p>
										<p className="text-muted-foreground text-xs">New email · {compose.handle}</p>
									</div>
								</header>
								<div className="min-h-0 flex-1" />
								<form action={startThread} className="border-t border-border px-6 py-4 pb-16">
									<input type="hidden" name="channel" value="email" />
									<input type="hidden" name="handle" value={compose.handle} />
									{compose.name ? <input type="hidden" name="name" value={compose.name} /> : null}
									<Input name="subject" placeholder="Subject" className="mb-2" />
									<Textarea
										name="body"
										required
										placeholder={`Write to ${compose.handle}…`}
										className="min-h-20"
									/>
									<div className="mt-2 flex items-center justify-between gap-3">
										<p className="text-muted-foreground text-xs">
											{status.email
												? "Sends on Email."
												: "Stays in this inbox until Email is connected."}
										</p>
										<Button type="submit">Send</Button>
									</div>
								</form>
							</>
						) : (
							<p className="text-muted-foreground p-8">No threads yet.</p>
						)}
					</section>
				</div>
			</div>
		</ConsoleShell>
	);
}

function ChannelLink({
	href,
	active,
	children,
}: {
	href: string;
	active: boolean;
	children: string;
}) {
	return (
		<Link
			href={href}
			className={cn(
				"rounded-md px-2.5 py-1 text-xs",
				active ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent"
			)}
		>
			{children}
		</Link>
	);
}
