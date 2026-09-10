import { Badge } from "@rsvpwedday/ui/badge";
import { Button } from "@rsvpwedday/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@rsvpwedday/ui/card";
import { Input } from "@rsvpwedday/ui/input";
import { Label } from "@rsvpwedday/ui/label";
import { Textarea } from "@rsvpwedday/ui/textarea";
import { notFound } from "next/navigation";
import { saveClient } from "@/app/actions";
import { ConsoleShell } from "@/components/console-shell";
import { ContactLinks } from "@/components/contact-links";
import { FormSelect } from "@/components/form-select";
import { PlaceMap } from "@/components/place-map";
import { clientStatuses, clientStatusLabels, euro, featureLabels, pipelineValue } from "@/lib/crm";
import { getClient, getCrm } from "@/lib/store";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const client = await getClient(id);
	if (!client) notFound();
	const { providers } = await getCrm();
	const booked = providers.filter((provider) => client.providerIds.includes(provider.id));
	const margin = client.bookedVendorTotal - client.ourCost;
	const figures = [
		["Fee", euro.format(client.fee)],
		["Budget", euro.format(client.budget)],
		["Booked", euro.format(client.bookedVendorTotal)],
		["Pipeline", euro.format(pipelineValue(client))],
	] as const;

	return (
		<ConsoleShell pathname="/clients">
			<div className="flex flex-col gap-8">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="font-display text-3xl font-semibold tracking-tight">{client.couple}</h1>
						<p className="text-ink-soft mt-1 font-serif text-sm">
							{client.place.label} · {client.date}
							{client.domain ? ` · ${client.domain}` : ""}
						</p>
						<div className="mt-3">
							<ContactLinks contact={client.contact} />
						</div>
					</div>
					{client.guestOrigin ? (
						<Button asChild>
							<a href={client.guestOrigin} target="_blank" rel="noreferrer">
								Open guest site
							</a>
						</Button>
					) : null}
				</div>
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					{figures.map(([label, value]) => (
						<Card key={label}>
							<CardHeader className="pb-2">
								<CardTitle className="text-muted-foreground text-xs font-normal">{label}</CardTitle>
							</CardHeader>
							<CardContent className="font-display text-2xl font-semibold tabular-nums">
								{value}
							</CardContent>
						</Card>
					))}
				</div>
				<p className="text-ink-soft font-serif text-sm">
					Provider margin{" "}
					<span className="text-foreground font-sans tabular-nums">{euro.format(margin)}</span>.
					Couples never see these figures.
				</p>
				<PlaceMap place={client.place} />
				<section>
					<h2 className="font-display text-lg font-semibold tracking-tight">
						Providers on this weekend
					</h2>
					<ul className="mt-3 flex flex-wrap gap-2">
						{booked.length === 0 ? (
							<li className="text-ink-soft text-sm">None booked yet.</li>
						) : null}
						{booked.map((provider) => (
							<li key={provider.id}>
								<Badge variant="secondary">{provider.name}</Badge>
							</li>
						))}
					</ul>
				</section>
				<section>
					<h2 className="font-display text-lg font-semibold tracking-tight">Features</h2>
					<ul className="mt-3 flex flex-wrap gap-2">
						{(Object.keys(featureLabels) as Array<keyof typeof featureLabels>).map((flag) => (
							<li key={flag}>
								<Badge variant={client.features.includes(flag) ? "default" : "outline"}>
									{featureLabels[flag]}
								</Badge>
							</li>
						))}
					</ul>
				</section>
				<form action={saveClient} className="grid max-w-2xl gap-3 sm:grid-cols-2">
					<input type="hidden" name="id" value={client.id} />
					<input type="hidden" name="features" value={client.features.join(",")} />
					<input type="hidden" name="providerIds" value={client.providerIds.join(",")} />
					<Field label="Couple" name="couple" defaultValue={client.couple} />
					<Field label="Place" name="place" defaultValue={client.place.label} />
					<Field label="Address" name="address" defaultValue={client.place.address ?? ""} />
					<Field label="Date" name="date" type="date" defaultValue={client.date} />
					<FormSelect
						name="status"
						label="Status"
						defaultValue={client.status}
						options={clientStatuses.map((status) => ({
							value: status,
							label: clientStatusLabels[status],
						}))}
					/>
					<Field label="Domain" name="domain" defaultValue={client.domain ?? ""} />
					<Field label="Fee" name="fee" defaultValue={String(client.fee)} />
					<Field label="Budget" name="budget" defaultValue={String(client.budget)} />
					<Field
						label="Booked (couple)"
						name="bookedVendorTotal"
						defaultValue={String(client.bookedVendorTotal)}
					/>
					<Field label="Our cost" name="ourCost" defaultValue={String(client.ourCost)} />
					<Field label="Email" name="email" defaultValue={client.contact.email ?? ""} />
					<Field label="Phone" name="phone" defaultValue={client.contact.phone ?? ""} />
					<Field label="WhatsApp" name="whatsapp" defaultValue={client.contact.whatsapp ?? ""} />
					<div className="sm:col-span-2">
						<Label htmlFor="notes">Notes</Label>
						<Textarea id="notes" name="notes" defaultValue={client.notes ?? ""} />
					</div>
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
