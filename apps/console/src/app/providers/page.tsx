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
import { ConsoleShell } from "@/components/console-shell";
import { ContactLinks } from "@/components/contact-links";
import { FilterBar } from "@/components/filter-bar";
import { ProviderDialog } from "@/components/provider-dialog";
import { ProvidersMap } from "@/components/providers-map";
import { ProviderHover } from "@/components/record-hover";
import { RecordRow } from "@/components/record-row";
import { filterProviders, providerKindLabels, providerKinds, uniquePlaces } from "@/lib/crm";
import { mapEmbedSrc, mapsExternalHref } from "@/lib/geocode";
import { getCrm } from "@/lib/store";

export default async function ProvidersPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string; kind?: string; place?: string; view?: string }>;
}) {
	const filters = await searchParams;
	const { providers } = await getCrm();
	const rows = filterProviders(providers, filters);

	/* The rail panel is built here so the map URL is resolved on the server,
	   where the maps key lives, and the client only ever renders it. */
	const panels = new Map(
		rows.map((provider) => [
			provider.id,
			{
				title: provider.name,
				subtitle: `${providerKindLabels[provider.kind]} · ${provider.place.label}`,
				note: provider.notes,
				rows: [
					provider.place.address ? { label: "Address", value: provider.place.address } : null,
					provider.capacity ? { label: "Capacity", value: provider.capacity } : null,
					provider.hours ? { label: "Hours", value: provider.hours } : null,
					provider.contact.phone ? { label: "Phone", value: provider.contact.phone } : null,
					provider.contact.whatsapp
						? { label: "WhatsApp", value: provider.contact.whatsapp }
						: null,
					provider.contact.email ? { label: "Email", value: provider.contact.email } : null,
					provider.website ? { label: "Website", value: provider.website } : null,
				].filter((row) => row !== null),
				tags: [...provider.tags],
				href: `/providers/${provider.id}`,
				mapSrc: mapEmbedSrc(provider.place),
				mapHref: provider.place.lat != null ? mapsExternalHref(provider.place) : null,
			},
		])
	);

	return (
		<ConsoleShell pathname="/providers">
			<div className="flex flex-col gap-6">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h1 className="text-3xl font-semibold tracking-tight">Providers</h1>
						<p className="text-muted-foreground mt-1 max-w-2xl text-sm">
							Houses, kitchens, flowers and photographers we actually work with. An address is
							geocoded on save, which is what puts a pin on the map.
						</p>
					</div>
					<ProviderDialog />
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

				<Tabs defaultValue={filters.view === "map" ? "map" : "list"}>
					<TabsList>
						<TabsTrigger value="list">List</TabsTrigger>
						<TabsTrigger value="map">Map</TabsTrigger>
					</TabsList>

					<TabsContent value="list">
						<div className="overflow-hidden rounded-lg border">
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
										<RecordRow
											key={provider.id}
											panel={panels.get(provider.id) as NonNullable<ReturnType<typeof panels.get>>}
										>
											<TableCell className="font-medium">
												<ProviderHover provider={provider}>
													<Link href={`/providers/${provider.id}`} className="hover:underline">
														{provider.name}
													</Link>
												</ProviderHover>
											</TableCell>
											<TableCell>
												<Badge variant="secondary" className="font-normal">
													{providerKindLabels[provider.kind]}
												</Badge>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{provider.place.label}
											</TableCell>
											<TableCell>
												<ContactLinks contact={provider.contact} name={provider.name} />
											</TableCell>
											<TableCell className="text-muted-foreground text-pretty whitespace-normal">
												{provider.notes}
											</TableCell>
										</RecordRow>
									))}
								</TableBody>
							</Table>
						</div>
					</TabsContent>

					<TabsContent value="map">
						<ProvidersMap providers={rows} />
					</TabsContent>
				</Tabs>
			</div>
		</ConsoleShell>
	);
}
