import { Card, CardContent, CardHeader, CardTitle } from "@rsvpwedday/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@rsvpwedday/ui/table";
import { ConsoleShell } from "@/components/console-shell";
import { euro, pipelineValue } from "@/lib/crm";
import { getCrm } from "@/lib/store";

export default async function AnalyticsPage() {
	const { leads, clients, providers } = await getCrm();
	const pipeline = clients.reduce((sum, client) => sum + pipelineValue(client), 0);
	const fee = clients.reduce((sum, client) => sum + client.fee, 0);
	const byPlace = new Map<string, { fee: number; count: number }>();
	for (const client of clients) {
		const current = byPlace.get(client.place.label) ?? { fee: 0, count: 0 };
		current.fee += client.fee;
		current.count += 1;
		byPlace.set(client.place.label, current);
	}

	return (
		<ConsoleShell pathname="/analytics">
			<div className="flex flex-col gap-8">
				<div>
					<h1 className="font-display text-3xl font-semibold tracking-tight">Analytics</h1>
					<p className="text-ink-soft mt-1 font-serif text-sm">
						Studio pipeline — not couple-facing.
					</p>
				</div>
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<Stat label="Pipeline" value={euro.format(pipeline)} />
					<Stat label="Fees" value={euro.format(fee)} />
					<Stat label="Leads" value={String(leads.length)} />
					<Stat label="Providers" value={String(providers.length)} />
				</div>
				<div className="rounded-xl bg-card ring-1 ring-foreground/10">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Place</TableHead>
								<TableHead>Weddings</TableHead>
								<TableHead>Fees</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{[...byPlace.entries()].map(([place, row]) => (
								<TableRow key={place}>
									<TableCell className="font-medium">{place}</TableCell>
									<TableCell className="tabular-nums">{row.count}</TableCell>
									<TableCell className="tabular-nums">{euro.format(row.fee)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		</ConsoleShell>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-muted-foreground text-xs font-normal">{label}</CardTitle>
			</CardHeader>
			<CardContent className="font-display text-2xl font-semibold tabular-nums">
				{value}
			</CardContent>
		</Card>
	);
}
