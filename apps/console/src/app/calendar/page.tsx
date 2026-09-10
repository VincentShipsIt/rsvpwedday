import { Badge } from "@rsvpwedday/ui/badge";
import { Button } from "@rsvpwedday/ui/button";
import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";
import { coupleStatusLabels } from "@/lib/crm";
import { getCrm } from "@/lib/store";

export default async function CalendarPage() {
	const { couples } = await getCrm();
	const events = couples
		.filter((row) => row.date)
		.map((row) => ({
			id: row.id,
			href: `/couples/${row.id}`,
			title: row.couple,
			date: row.date as string,
			place: row.place.label,
			status: coupleStatusLabels[row.status],
		}))
		.sort((a, b) => a.date.localeCompare(b.date));

	const groups = events.reduce((map, event) => {
		const key = event.date.slice(0, 7);
		map.set(key, [...(map.get(key) ?? []), event]);
		return map;
	}, new Map<string, typeof events>());

	return (
		<ConsoleShell pathname="/calendar">
			<div className="flex flex-col gap-8">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h1 className="font-display text-3xl font-semibold tracking-tight">Calendar</h1>
						<p className="text-ink-soft mt-1 font-serif text-sm">
							Every dated couple. Subscribe with the ICS feed in Google Calendar or Apple Calendar.
						</p>
					</div>
					<Button variant="outline" asChild>
						<a href="/calendar/feed.ics">Download .ics</a>
					</Button>
				</div>
				{[...groups.entries()].map(([month, rows]) => (
					<section key={month}>
						<h2 className="font-display text-lg font-semibold tracking-tight">
							{new Date(`${month}-01T12:00:00`).toLocaleDateString("en-GB", {
								month: "long",
								year: "numeric",
							})}
						</h2>
						<ul className="mt-3 divide-y divide-ink/10 rounded-xl bg-card ring-1 ring-foreground/10">
							{rows.map((event) => (
								<li key={event.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
									<p className="w-28 tabular-nums">{event.date}</p>
									<Link href={event.href} className="font-medium hover:text-saffron">
										{event.title}
									</Link>
									<p className="text-ink-soft font-serif text-sm">{event.place}</p>
									<Badge variant="secondary">{event.status}</Badge>
								</li>
							))}
						</ul>
					</section>
				))}
			</div>
		</ConsoleShell>
	);
}
