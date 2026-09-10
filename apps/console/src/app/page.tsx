import { Badge } from "@rsvpwedday/ui/badge";
import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";
import {
	channelLabels,
	coupleStatusLabels,
	euro,
	isClientStatus,
	isLeadStatus,
	pipelineValue,
} from "@/lib/crm";
import { lastMessage, sortThreads } from "@/lib/inbox";
import { openRouterConfigured } from "@/lib/openrouter";
import { getCrm } from "@/lib/store";

const dayFormat = new Intl.DateTimeFormat("en-GB", {
	weekday: "long",
	day: "numeric",
	month: "long",
});

export default async function HomePage() {
	const { couples, providers, threads } = await getCrm();
	const leads = couples.filter((row) => isLeadStatus(row.status));
	const clients = couples.filter((row) => isClientStatus(row.status));
	const unread = threads.filter((thread) => thread.unread);
	const pipeline = clients.reduce((sum, row) => sum + pipelineValue(row), 0);

	/* Anything with a date still ahead of us, soonest first — the only
	   ordering that answers "what is actually coming". */
	const upcoming = clients
		.filter((row) => row.date && row.date >= new Date().toISOString().slice(0, 10))
		.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
		.slice(0, 4);

	const recent = sortThreads(threads).slice(0, 5);

	return (
		<ConsoleShell pathname="/">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-9">
				<div>
					<p className="text-muted-foreground text-[13px]">{dayFormat.format(new Date())}</p>
					<h1 className="mt-1 text-2xl font-semibold tracking-tight">Good morning</h1>
					{!openRouterConfigured() ? (
						<p className="text-muted-foreground mt-2 text-[13px]">
							The agent has no OPENROUTER_API_KEY, so it will say so rather than answer. Everything
							else on this page is live.
						</p>
					) : null}
				</div>

				<dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-4">
					<Stat label="Unread" value={String(unread.length)} />
					<Stat label="Leads" value={String(leads.length)} />
					<Stat label="Weddings booked" value={String(clients.length)} />
					<Stat label="Pipeline" value={euro.format(pipeline)} />
				</dl>

				<section className="flex flex-col gap-3">
					<div className="flex items-baseline justify-between gap-3">
						<h2 className="text-[13px] font-semibold">Coming up</h2>
						<Link href="/calendar" className="text-muted-foreground text-[12px] hover:underline">
							Calendar
						</Link>
					</div>
					{upcoming.length === 0 ? (
						<Empty>No confirmed wedding has a date yet.</Empty>
					) : (
						<ul className="divide-y overflow-hidden rounded-lg border">
							{upcoming.map((row) => (
								<li key={row.id}>
									<Link
										href={`/couples/${row.id}`}
										className="hover:bg-accent flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 transition-colors"
									>
										<span className="text-[13px] font-medium">{row.couple}</span>
										<span className="text-muted-foreground text-[12px]">{row.place.label}</span>
										<Badge variant="secondary" className="ml-auto shrink-0 font-normal">
											{coupleStatusLabels[row.status]}
										</Badge>
										<span className="text-muted-foreground w-20 shrink-0 text-right text-[12px] tabular-nums">
											{row.date}
										</span>
									</Link>
								</li>
							))}
						</ul>
					)}
				</section>

				<section className="flex flex-col gap-3">
					<div className="flex items-baseline justify-between gap-3">
						<h2 className="text-[13px] font-semibold">Latest replies</h2>
						<Link href="/inbox" className="text-muted-foreground text-[12px] hover:underline">
							Inbox
						</Link>
					</div>
					{recent.length === 0 ? (
						<Empty>Nothing has come in yet.</Empty>
					) : (
						<ul className="divide-y overflow-hidden rounded-lg border">
							{recent.map((thread) => {
								const message = lastMessage(thread);
								return (
									<li key={thread.id}>
										<Link
											href={`/inbox?thread=${thread.id}`}
											className="hover:bg-accent flex flex-col gap-1 px-3 py-2.5 transition-colors"
										>
											<span className="flex items-center gap-2">
												{thread.unread ? (
													<>
														<span
															className="bg-primary size-1.5 shrink-0 rounded-full"
															aria-hidden="true"
														/>
														<span className="sr-only">Unread</span>
													</>
												) : null}
												<span className="text-[13px] font-medium">{thread.contactName}</span>
												<span className="text-muted-foreground text-[12px]">
													{channelLabels[thread.channel]}
												</span>
											</span>
											{message ? (
												<span className="text-muted-foreground line-clamp-1 text-[12px]">
													{message.body}
												</span>
											) : null}
										</Link>
									</li>
								);
							})}
						</ul>
					)}
				</section>

				<p className="text-muted-foreground text-[12px]">
					{providers.length} providers on the roster.{" "}
					<Link href="/providers" className="hover:underline">
						Open the roster
					</Link>
				</p>
			</div>
		</ConsoleShell>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-background px-4 py-3">
			<dt className="text-muted-foreground text-[12px]">{label}</dt>
			<dd className="mt-0.5 text-xl font-semibold tabular-nums">{value}</dd>
		</div>
	);
}

function Empty({ children }: { children: string }) {
	return (
		<p className="text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-[12px]">
			{children}
		</p>
	);
}
