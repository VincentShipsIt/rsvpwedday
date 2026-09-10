import { Button } from "@rsvpwedday/ui/button";
import { Input } from "@rsvpwedday/ui/input";
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
import { moveLead, saveLead } from "@/app/actions";
import { ConsoleShell } from "@/components/console-shell";
import { ContactLinks } from "@/components/contact-links";
import { FilterBar } from "@/components/filter-bar";
import { StageBoard } from "@/components/stage-board";
import { filterLeads, leadStageLabels, leadStages, uniquePlaces } from "@/lib/crm";
import { getCrm } from "@/lib/store";

export default async function LeadsPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string; stage?: string; place?: string; view?: string }>;
}) {
	const filters = await searchParams;
	const { leads } = await getCrm();
	const rows = filterLeads(leads, filters);
	const places = uniquePlaces(leads);

	return (
		<ConsoleShell pathname="/leads">
			<div className="flex flex-col gap-8">
				<div>
					<h1 className="font-display text-3xl font-semibold tracking-tight">Leads</h1>
					<p className="text-ink-soft mt-1 font-serif text-sm">
						Enquiries before they are a wedding on the books.
					</p>
				</div>
				<Suspense>
					<FilterBar
						selects={[
							{
								name: "stage",
								label: "Stage",
								options: leadStages.map((stage) => ({
									value: stage,
									label: leadStageLabels[stage],
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
							columns={leadStages.map((id) => ({ id, label: leadStageLabels[id] }))}
							items={rows.map((lead) => ({
								id: lead.id,
								href: `/leads/${lead.id}`,
								title: lead.couple,
								meta: `${lead.place.label}${lead.date ? ` · ${lead.date}` : ""}`,
								column: lead.stage,
							}))}
							move={moveLead}
						/>
					</TabsContent>
					<TabsContent value="table">
						<div className="rounded-xl bg-card ring-1 ring-foreground/10">
							<Table>
								<TableCaption className="sr-only">Leads</TableCaption>
								<TableHeader>
									<TableRow>
										<TableHead>Couple</TableHead>
										<TableHead>Stage</TableHead>
										<TableHead>Place</TableHead>
										<TableHead>Date</TableHead>
										<TableHead>Contact</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{rows.map((lead) => (
										<TableRow key={lead.id}>
											<TableCell className="font-medium">
												<Link href={`/leads/${lead.id}`}>{lead.couple}</Link>
											</TableCell>
											<TableCell>{leadStageLabels[lead.stage]}</TableCell>
											<TableCell className="text-ink-soft">{lead.place.label}</TableCell>
											<TableCell className="tabular-nums">{lead.date ?? "—"}</TableCell>
											<TableCell>
												<ContactLinks contact={lead.contact} />
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</TabsContent>
				</Tabs>
				<section className="max-w-xl">
					<h2 className="font-display text-lg font-semibold tracking-tight">Quick add</h2>
					<form action={saveLead} className="mt-3 grid gap-2 sm:grid-cols-2">
						<Input name="couple" required placeholder="Couple" aria-label="Couple" />
						<Input name="place" required placeholder="Place" aria-label="Place" />
						<Input name="date" type="date" aria-label="Date" />
						<Input name="whatsapp" placeholder="WhatsApp" aria-label="WhatsApp" />
						<Button type="submit" className="sm:col-span-2">
							Save lead
						</Button>
					</form>
				</section>
			</div>
		</ConsoleShell>
	);
}
