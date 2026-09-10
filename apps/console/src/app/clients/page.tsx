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
import { moveCouple } from "@/app/actions";
import { ConsoleShell } from "@/components/console-shell";
import { CoupleDialog } from "@/components/couple-dialog";
import { FilterBar } from "@/components/filter-bar";
import { StageBoard } from "@/components/stage-board";
import {
	clientStatuses,
	coupleStatusLabels,
	euro,
	filterCouples,
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
	const { couples } = await getCrm();
	const rows = filterCouples(couples, { ...filters, lane: "client" });
	const pipeline = rows.reduce((sum, row) => sum + pipelineValue(row), 0);

	return (
		<ConsoleShell pathname="/clients">
			<div className="flex flex-col gap-8">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h1 className="font-display text-3xl font-semibold tracking-tight">Clients</h1>
						<p className="text-ink-soft mt-1 font-serif text-sm">
							Validated couples — status Confirmed or later.
						</p>
					</div>
					<div className="flex items-center gap-4">
						<p className="font-serif text-sm">
							Pipeline{" "}
							<span className="font-sans font-medium tabular-nums">{euro.format(pipeline)}</span>
						</p>
						<CoupleDialog defaultStatus="confirmed" label="New couple" />
					</div>
				</div>
				<Suspense>
					<FilterBar
						selects={[
							{
								name: "status",
								label: "Status",
								options: clientStatuses.map((status) => ({
									value: status,
									label: coupleStatusLabels[status],
								})),
							},
							{
								name: "place",
								label: "Place",
								options: uniquePlaces(couples).map((place) => ({ value: place, label: place })),
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
							columns={clientStatuses.map((id) => ({ id, label: coupleStatusLabels[id] }))}
							items={rows.map((row) => ({
								id: row.id,
								href: `/couples/${row.id}`,
								title: row.couple,
								meta: `${row.place.label}${row.date ? ` · ${row.date}` : ""}`,
								column: row.status,
							}))}
							move={moveCouple}
						/>
					</TabsContent>
					<TabsContent value="table">
						<div className="rounded-xl bg-card ring-1 ring-foreground/10">
							<Table>
								<TableCaption className="sr-only">Clients</TableCaption>
								<TableHeader>
									<TableRow>
										<TableHead>Couple</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Fee</TableHead>
										<TableHead>Pipeline</TableHead>
										<TableHead>
											<span className="sr-only">Open</span>
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{rows.map((row) => (
										<TableRow key={row.id}>
											<TableCell>
												<p className="font-medium">{row.couple}</p>
												<p className="text-ink-soft text-xs">
													{row.place.label} · {row.date}
												</p>
											</TableCell>
											<TableCell>
												<Badge variant="secondary">{coupleStatusLabels[row.status]}</Badge>
											</TableCell>
											<TableCell className="tabular-nums">{euro.format(row.fee)}</TableCell>
											<TableCell className="tabular-nums">
												{euro.format(pipelineValue(row))}
											</TableCell>
											<TableCell className="text-right">
												<Button variant="outline" size="sm" asChild>
													<Link href={`/couples/${row.id}`}>Open</Link>
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
