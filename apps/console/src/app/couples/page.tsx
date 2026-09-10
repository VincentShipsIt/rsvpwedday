import { Badge } from "@rsvpwedday/ui/badge";
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
import { CoupleHover } from "@/components/record-hover";
import { RecordRow } from "@/components/record-row";
import { StageBoard } from "@/components/stage-board";
import {
	type CoupleStatus,
	clientStatuses,
	coupleStatuses,
	coupleStatusLabels,
	euro,
	filterCouples,
	leadStatuses,
	pipelineValue,
	uniquePlaces,
} from "@/lib/crm";
import { getCrm } from "@/lib/store";
import { cn } from "@/lib/utils";

/*
 * Leads and Clients were two routes over one table, so confirming a couple
 * made them vanish from the page you were on and reappear on another. They are
 * one record with a status, and this is one page with a lane filter — the old
 * paths redirect here.
 */
const LANES = [
	{ id: "all", label: "All", statuses: coupleStatuses },
	{ id: "lead", label: "Leads", statuses: leadStatuses },
	{ id: "client", label: "Clients", statuses: clientStatuses },
] as const;

type Lane = (typeof LANES)[number]["id"];

export default async function CouplesPage({
	searchParams,
}: {
	searchParams: Promise<{
		q?: string;
		status?: string;
		place?: string;
		view?: string;
		lane?: string;
	}>;
}) {
	const filters = await searchParams;
	const lane: Lane = filters.lane === "lead" || filters.lane === "client" ? filters.lane : "all";
	const active = LANES.find((entry) => entry.id === lane) ?? LANES[0];

	const { couples } = await getCrm();
	const rows = filterCouples(couples, {
		...filters,
		lane: lane === "all" ? undefined : lane,
	});
	const pipeline = rows.reduce((sum, row) => sum + pipelineValue(row), 0);

	function laneHref(next: Lane): string {
		const params = new URLSearchParams();
		if (next !== "all") params.set("lane", next);
		if (filters.q) params.set("q", filters.q);
		if (filters.place) params.set("place", filters.place);
		if (filters.view) params.set("view", filters.view);
		const query = params.toString();
		return query ? `/couples?${query}` : "/couples";
	}

	return (
		<ConsoleShell pathname="/couples">
			<div className="flex flex-col gap-6">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h1 className="text-3xl font-semibold tracking-tight">Couples</h1>
						<p className="text-muted-foreground mt-1 text-sm">
							One record from first enquiry to the day itself. Confirming a couple moves them from
							Leads to Clients — it does not move them to another page.
						</p>
					</div>
					<div className="flex items-center gap-4">
						{pipeline > 0 ? (
							<p className="text-sm">
								Pipeline <span className="font-medium tabular-nums">{euro.format(pipeline)}</span>
							</p>
						) : null}
						<CoupleDialog
							defaultStatus={lane === "client" ? "confirmed" : "new"}
							label="New couple"
						/>
					</div>
				</div>

				<nav aria-label="Lane" className="flex gap-1">
					{LANES.map((entry) => (
						<Link
							key={entry.id}
							href={laneHref(entry.id)}
							aria-current={entry.id === lane ? "page" : undefined}
							className={cn(
								"rounded-md px-2.5 py-1 text-[13px] transition-colors",
								entry.id === lane
									? "bg-accent text-accent-foreground font-medium"
									: "text-muted-foreground hover:bg-accent"
							)}
						>
							{entry.label}
						</Link>
					))}
				</nav>

				<Suspense>
					<FilterBar
						selects={[
							{
								name: "status",
								label: "Status",
								options: active.statuses.map((status) => ({
									value: status,
									label: coupleStatusLabels[status as CoupleStatus],
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

				<Tabs defaultValue={filters.view === "table" ? "table" : "board"}>
					<TabsList>
						<TabsTrigger value="board">Board</TabsTrigger>
						<TabsTrigger value="table">Table</TabsTrigger>
					</TabsList>

					<TabsContent value="board">
						<StageBoard
							columns={active.statuses.map((id) => ({
								id,
								label: coupleStatusLabels[id as CoupleStatus],
							}))}
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
						<div className="overflow-hidden rounded-lg border">
							<Table>
								<TableCaption className="sr-only">Couples</TableCaption>
								<TableHeader>
									<TableRow>
										<TableHead>Couple</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Place</TableHead>
										<TableHead>Date</TableHead>
										<TableHead className="text-right">Fee</TableHead>
										<TableHead className="text-right">Pipeline</TableHead>
										<TableHead>Contact</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{rows.map((row) => (
										<RecordRow
											key={row.id}
											panel={{
												title: row.couple,
												subtitle: `${coupleStatusLabels[row.status]} · ${row.place.label}`,
												note: row.notes,
												rows: [
													row.date ? { label: "Date", value: row.date } : null,
													row.fee ? { label: "Fee", value: euro.format(row.fee) } : null,
													row.budget ? { label: "Budget", value: euro.format(row.budget) } : null,
													pipelineValue(row)
														? { label: "Pipeline", value: euro.format(pipelineValue(row)) }
														: null,
													row.contact.email ? { label: "Email", value: row.contact.email } : null,
													row.contact.whatsapp
														? { label: "WhatsApp", value: row.contact.whatsapp }
														: null,
													row.source ? { label: "Source", value: row.source } : null,
													row.domain ? { label: "Domain", value: row.domain } : null,
												].filter((entry) => entry !== null),
												href: `/couples/${row.id}`,
											}}
										>
											<TableCell className="font-medium">
												<CoupleHover couple={row}>
													<Link href={`/couples/${row.id}`} className="hover:underline">
														{row.couple}
													</Link>
												</CoupleHover>
											</TableCell>
											<TableCell>
												<Badge variant="secondary" className="font-normal">
													{coupleStatusLabels[row.status]}
												</Badge>
											</TableCell>
											<TableCell className="text-muted-foreground">{row.place.label}</TableCell>
											<TableCell className="tabular-nums">{row.date ?? "—"}</TableCell>
											<TableCell className="text-right tabular-nums">
												{row.fee ? euro.format(row.fee) : "—"}
											</TableCell>
											<TableCell className="text-right tabular-nums">
												{pipelineValue(row) ? euro.format(pipelineValue(row)) : "—"}
											</TableCell>
											<TableCell>
												<ContactLinks contact={row.contact} name={row.couple} />
											</TableCell>
										</RecordRow>
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
