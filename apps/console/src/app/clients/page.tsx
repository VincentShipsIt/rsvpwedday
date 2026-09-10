import { Badge } from "@rsvpwedday/ui/badge";
import { Button } from "@rsvpwedday/ui/button";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@rsvpwedday/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rsvpwedday/ui/tabs";
import Link from "next/link";
import { Suspense } from "react";
import { moveClient } from "@/app/actions";
import { ConsoleShell } from "@/components/console-shell";
import { FilterBar } from "@/components/filter-bar";
import { StageBoard } from "@/components/stage-board";
import {
	clientStatuses,
	clientStatusLabels,
	euro,
	filterClients,
	pipelineValue,
	uniquePlaces,
} from "@/lib/crm";
import { getCrm } from "@/lib/store";

export default async function ClientsPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string; status?: string; place?: string }>;
}) {
	const filters = await searchParams;
	const { clients } = await getCrm();
	const rows = filterClients(clients, filters);
	const pipeline = rows.reduce((sum, client) => sum + pipelineValue(client), 0);

	return (
		<ConsoleShell pathname="/clients">
			<div className="flex flex-col gap-8">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h1 className="font-display text-3xl font-semibold tracking-tight">Clients</h1>
						<p className="text-ink-soft mt-1 font-serif text-sm">
							Weddings on the books. Fee plus margin on booked providers.
						</p>
					</div>
					<p className="font-serif text-sm">
						Pipeline{" "}
						<span className="font-sans font-medium tabular-nums">{euro.format(pipeline)}</span>
					</p>
				</div>
				<Suspense>
					<FilterBar
						selects={[
							{
								name: "status",
								label: "Status",
								options: clientStatuses.map((status) => ({
									value: status,
									label: clientStatusLabels[status],
								})),
							},
							{
								name: "place",
								label: "Place",
								options: uniquePlaces(clients).map((place) => ({ value: place, label: place })),
							},
						]}
					/>
				</Suspense>
				<Tabs defaultValue="board">
					<TabsList>
						<TabsTrigger value="board">Board</TabsTrigger>
						<TabsTrigger value="table">Table</TabsTrigger>
					</TabsList>
					<TabsContent value="board">
						<StageBoard
							columns={clientStatuses.map((id) => ({ id, label: clientStatusLabels[id] }))}
							items={rows.map((client) => ({
								id: client.id,
								href: `/clients/${client.id}`,
								title: client.couple,
								meta: `${client.place.label} · ${client.date}`,
								column: client.status,
							}))}
							move={moveClient}
						/>
					</TabsContent>
					<TabsContent value="table">
						<div className="rounded-xl bg-card ring-1 ring-foreground/10">
							<Table>
								<TableCaption className="sr-only">Clients</TableCaption>
								<TableHeader>
									<TableRow>
										<TableHead>Client</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Fee</TableHead>
										<TableHead>Pipeline</TableHead>
										<TableHead>Features</TableHead>
										<TableHead>
											<span className="sr-only">Open</span>
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{rows.map((client) => (
										<TableRow key={client.id}>
											<TableCell>
												<p className="font-medium">{client.couple}</p>
												<p className="text-ink-soft text-xs">
													{client.place.label} · {client.date}
												</p>
											</TableCell>
											<TableCell>
												<Badge variant="secondary">{clientStatusLabels[client.status]}</Badge>
											</TableCell>
											<TableCell className="tabular-nums">{euro.format(client.fee)}</TableCell>
											<TableCell className="tabular-nums">
												{euro.format(pipelineValue(client))}
											</TableCell>
											<TableCell className="text-pretty whitespace-normal">
												{client.features.join(" · ")}
											</TableCell>
											<TableCell className="text-right">
												<Button variant="outline" size="sm" asChild>
													<Link href={`/clients/${client.id}`}>Open</Link>
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</ConsoleShell>
	);
}
