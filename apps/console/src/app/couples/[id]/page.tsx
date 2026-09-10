import { Badge } from "@rsvpwedday/ui/badge";
import { Button } from "@rsvpwedday/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@rsvpwedday/ui/card";
import { Input } from "@rsvpwedday/ui/input";
import { Label } from "@rsvpwedday/ui/label";
import { Textarea } from "@rsvpwedday/ui/textarea";
import Link from "next/link";
import { notFound } from "next/navigation";
import { moveCouple, updateCouple } from "@/app/actions";
import { ConsoleShell } from "@/components/console-shell";
import { ContactLinks } from "@/components/contact-links";
import { FormSelect } from "@/components/form-select";
import { PlaceMap } from "@/components/place-map";
import {
	coupleLane,
	coupleStatuses,
	coupleStatusLabels,
	euro,
	featureLabels,
	isClientStatus,
	pipelineValue,
} from "@/lib/crm";
import { getCouple, getCrm } from "@/lib/store";

export default async function CouplePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const row = await getCouple(id);
	if (!row) notFound();
	const { providers } = await getCrm();
	const booked = providers.filter((provider) => row.providerIds.includes(provider.id));
	const lane = coupleLane(row.status);
	const figures = [
		["Fee", euro.format(row.fee)],
		["Budget", euro.format(row.budget)],
		["Booked", euro.format(row.bookedVendorTotal)],
		["Pipeline", euro.format(pipelineValue(row))],
	] as const;

	return (
		<ConsoleShell pathname="/couples">
			<div className="flex flex-col gap-8">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<Button variant="ghost" size="sm" className="-ml-2 mb-1" asChild>
							<Link href={lane === "client" ? "/couples?lane=client" : "/couples?lane=lead"}>
								← {lane === "client" ? "Clients" : "Leads"}
							</Link>
						</Button>
						<p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
							{lane === "client" ? "Client" : "Lead"}
						</p>
						<h1 className="mt-1 text-3xl font-semibold tracking-tight">{row.couple}</h1>
						<p className="text-muted-foreground mt-1 text-sm">
							{coupleStatusLabels[row.status]} · {row.place.label}
							{row.date ? ` · ${row.date}` : ""}
							{row.domain ? ` · ${row.domain}` : ""}
						</p>
						<div className="mt-3">
							<ContactLinks contact={row.contact} />
						</div>
						{row.features.length > 0 ? (
							<ul className="mt-3 flex flex-wrap gap-1">
								{row.features.map((flag) => (
									<li key={flag}>
										<Badge variant="outline">{featureLabels[flag]}</Badge>
									</li>
								))}
							</ul>
						) : null}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{lane === "lead" && row.status !== "lost" ? (
							<form action={moveCouple.bind(null, row.id, "confirmed")}>
								<Button type="submit">Confirm as client</Button>
							</form>
						) : null}
						{row.guestOrigin ? (
							<Button variant={lane === "lead" ? "outline" : "default"} asChild>
								<a href={row.guestOrigin} target="_blank" rel="noreferrer">
									Open guest site
								</a>
							</Button>
						) : null}
					</div>
				</div>
				{isClientStatus(row.status) ? (
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
						{figures.map(([label, value]) => (
							<Card key={label}>
								<CardHeader className="pb-2">
									<CardTitle className="text-muted-foreground text-xs font-normal">
										{label}
									</CardTitle>
								</CardHeader>
								<CardContent className="text-2xl font-semibold tabular-nums">{value}</CardContent>
							</Card>
						))}
					</div>
				) : null}
				<PlaceMap place={row.place} />
				<section>
					<h2 className="text-lg font-semibold tracking-tight">Providers</h2>
					<ul className="mt-3 flex flex-wrap gap-2">
						{booked.length === 0 ? (
							<li className="text-muted-foreground text-sm">None booked yet.</li>
						) : null}
						{booked.map((provider) => (
							<li key={provider.id}>
								<Badge variant="secondary">{provider.name}</Badge>
							</li>
						))}
					</ul>
				</section>
				<form action={updateCouple} className="grid max-w-2xl gap-3 sm:grid-cols-2">
					<input type="hidden" name="id" value={row.id} />
					<input type="hidden" name="createdAt" value={row.createdAt} />
					<input type="hidden" name="features" value={row.features.join(",")} />
					<input type="hidden" name="providerIds" value={row.providerIds.join(",")} />
					<Field label="Couple" name="couple" defaultValue={row.couple} />
					<Field label="Place" name="place" defaultValue={row.place.label} />
					<Field label="Address" name="address" defaultValue={row.place.address ?? ""} />
					<Field label="Date" name="date" type="date" defaultValue={row.date ?? ""} />
					<FormSelect
						name="status"
						label="Status"
						defaultValue={row.status}
						options={coupleStatuses.map((status) => ({
							value: status,
							label: coupleStatusLabels[status],
						}))}
					/>
					<Field label="Source" name="source" defaultValue={row.source ?? ""} />
					<Field label="Email" name="email" defaultValue={row.contact.email ?? ""} />
					<Field label="Phone" name="phone" defaultValue={row.contact.phone ?? ""} />
					<Field label="WhatsApp" name="whatsapp" defaultValue={row.contact.whatsapp ?? ""} />
					<Field label="Instagram" name="instagram" defaultValue={row.contact.instagram ?? ""} />
					<Field label="Domain" name="domain" defaultValue={row.domain ?? ""} />
					<Field label="Fee" name="fee" defaultValue={String(row.fee)} />
					<Field label="Budget" name="budget" defaultValue={String(row.budget)} />
					<div className="sm:col-span-2">
						<Label htmlFor="notes">Notes</Label>
						<Textarea id="notes" name="notes" defaultValue={row.notes ?? ""} />
					</div>
					{lane === "lead" ? (
						<p className="text-muted-foreground sm:col-span-2 text-sm">
							Set status to Confirmed to validate the lead — they show up under Clients.
						</p>
					) : null}
					<Button type="submit" className="sm:col-span-2">
						Save — geocode address
					</Button>
				</form>
			</div>
		</ConsoleShell>
	);
}

function Field({
	label,
	name,
	defaultValue,
	type = "text",
}: {
	label: string;
	name: string;
	defaultValue: string;
	type?: string;
}) {
	return (
		<div>
			<Label htmlFor={name}>{label}</Label>
			<Input id={name} name={name} type={type} defaultValue={defaultValue} />
		</div>
	);
}
