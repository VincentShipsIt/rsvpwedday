import { Badge } from "@rsvpwedday/ui/badge";
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
import Link from "next/link";
import { Suspense } from "react";
import { saveProvider } from "@/app/actions";
import { ConsoleShell } from "@/components/console-shell";
import { ContactLinks } from "@/components/contact-links";
import { FilterBar } from "@/components/filter-bar";
import { FormSelect } from "@/components/form-select";
import { PlaceMap } from "@/components/place-map";
import { filterProviders, providerKindLabels, providerKinds, uniquePlaces } from "@/lib/crm";
import { getCrm } from "@/lib/store";

export default async function ProvidersPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string; kind?: string; place?: string }>;
}) {
	const filters = await searchParams;
	const { providers } = await getCrm();
	const rows = filterProviders(providers, filters);
	const mapped = rows.filter((row) => row.place.lat != null && row.place.lng != null);

	return (
		<ConsoleShell pathname="/providers">
			<div className="flex flex-col gap-8">
				<div>
					<h1 className="font-display text-3xl font-semibold tracking-tight">Providers</h1>
					<p className="text-ink-soft mt-1 max-w-2xl font-serif text-sm">
						Houses, kitchens, flowers, photographers we actually work with. Saving a row geocodes
						the address. Kitchens keep phone and WhatsApp on the card.
					</p>
				</div>
				<Suspense>
					<FilterBar
						selects={[
							{
								name: "kind",
								label: "Kind",
								options: providerKinds.map((kind) => ({
									value: kind,
									label: providerKindLabels[kind],
								})),
							},
							{
								name: "place",
								label: "Place",
								options: uniquePlaces(providers).map((place) => ({ value: place, label: place })),
							},
						]}
					/>
				</Suspense>
				{mapped[0] ? <PlaceMap place={mapped[0].place} /> : null}
				<div className="rounded-xl bg-card ring-1 ring-foreground/10">
					<Table>
						<TableCaption className="sr-only">Providers</TableCaption>
						<TableHeader>
							<TableRow>
								<TableHead>Provider</TableHead>
								<TableHead>Kind</TableHead>
								<TableHead>Place</TableHead>
								<TableHead>Contact</TableHead>
								<TableHead>Note</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((provider) => (
								<TableRow key={provider.id}>
									<TableCell className="font-medium">
										<Link href={`/providers/${provider.id}`}>{provider.name}</Link>
									</TableCell>
									<TableCell>
										<Badge variant="secondary">{providerKindLabels[provider.kind]}</Badge>
									</TableCell>
									<TableCell className="text-ink-soft">{provider.place.label}</TableCell>
									<TableCell>
										<ContactLinks contact={provider.contact} />
									</TableCell>
									<TableCell className="text-ink-soft font-serif text-pretty whitespace-normal">
										{provider.notes}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
				<section className="max-w-2xl">
					<h2 className="font-display text-lg font-semibold tracking-tight">Quick add</h2>
					<form action={saveProvider} className="mt-3 grid gap-2 sm:grid-cols-2">
						<Input name="name" required placeholder="Name" aria-label="Name" />
						<FormSelect
							name="kind"
							label="Kind"
							defaultValue="kitchen"
							options={providerKinds.map((kind) => ({
								value: kind,
								label: providerKindLabels[kind],
							}))}
						/>
						<Input name="place" required placeholder="Place" aria-label="Place" />
						<Input name="address" placeholder="Address" aria-label="Address" />
						<Input name="phone" placeholder="Phone" aria-label="Phone" />
						<Input name="whatsapp" placeholder="WhatsApp" aria-label="WhatsApp" />
						<Button type="submit" className="sm:col-span-2">
							Save — fetch map
						</Button>
					</form>
				</section>
			</div>
		</ConsoleShell>
	);
}
