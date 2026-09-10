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
import { ContactLinks } from "@/components/contact-links";
import { CoupleDialog } from "@/components/couple-dialog";
import { FilterBar } from "@/components/filter-bar";
import { StageBoard } from "@/components/stage-board";
import { coupleStatusLabels, filterCouples, leadStatuses, uniquePlaces } from "@/lib/crm";
import { getCrm } from "@/lib/store";

export default async function LeadsPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string; status?: string; place?: string; view?: string }>;
}) {
	const filters = await searchParams;
	const { couples } = await getCrm();
	const rows = filterCouples(couples, { ...filters, lane: "lead" });
	const places = uniquePlaces(couples);

	return (
		<ConsoleShell pathname="/leads">
			<div className="flex flex-col gap-8">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h1 className="font-display text-3xl font-semibold tracking-tight">Leads</h1>
						<p className="text-ink-soft mt-1 font-serif text-sm">
							Same couple record as Clients. Confirm the status and they move.
						</p>
					</div>
					<CoupleDialog defaultStatus="new" label="New couple" />
				</div>
				<Suspense>
					<FilterBar
						selects={[
							{
								name: "status",
								label: "Status",
								options: leadStatuses.map((status) => ({
									value: status,
									label: coupleStatusLabels[status],
								})),
							},
							{
								name: "place",
								label: "Place",
								options: places.map((place) => ({ value: place, label: place })),
							},
						]}
					/>
				</Suspense>
				<Tabs defaultValue={filters.view === "table" ? "table" : "board"}>
					<TabsList>
						<TabsTrigger value="board">Board</TabsTrigger>
						<TabsTrigger value="table">Table</TabsTrigger>
					</TabsList>
					<TabsContent value="board">
						<StageBoard
							columns={leadStatuses.map((id) => ({ id, label: coupleStatusLabels[id] }))}
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
								<TableCaption className="sr-only">Leads</TableCaption>
								<TableHeader>
									<TableRow>
										<TableHead>Couple</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Place</TableHead>
										<TableHead>Date</TableHead>
										<TableHead>Contact</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{rows.map((row) => (
										<TableRow key={row.id}>
											<TableCell className="font-medium">
												<Link href={`/couples/${row.id}`}>{row.couple}</Link>
											</TableCell>
											<TableCell>{coupleStatusLabels[row.status]}</TableCell>
											<TableCell className="text-ink-soft">{row.place.label}</TableCell>
											<TableCell className="tabular-nums">{row.date ?? "—"}</TableCell>
											<TableCell>
												<ContactLinks contact={row.contact} />
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
