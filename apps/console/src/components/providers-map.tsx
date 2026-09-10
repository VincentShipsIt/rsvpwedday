"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { type Provider, providerKindLabels } from "@/lib/crm";

/*
 * Plain Leaflet rather than react-leaflet: the map only ever needs to be built
 * once per set of pins, and going through the library would mean an SSR guard
 * and its broken default marker icons. The pins are `divIcon`s carrying our own
 * markup, so they inherit the console palette and ship no image assets.
 */
export function ProvidersMap({ providers }: { providers: Provider[] }) {
	const holder = useRef<HTMLDivElement>(null);

	const pins = providers.filter((row) => row.place.lat != null && row.place.lng != null);

	useEffect(() => {
		const node = holder.current;
		const pins = providers.filter((row) => row.place.lat != null && row.place.lng != null);
		if (!node || pins.length === 0) return;

		const map = L.map(node, { scrollWheelZoom: false, attributionControl: true });
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 18,
		}).addTo(map);

		for (const row of pins) {
			const label = `${row.name} — ${providerKindLabels[row.kind]}`;
			L.marker([row.place.lat as number, row.place.lng as number], {
				title: label,
				alt: label,
				icon: L.divIcon({
					className: "",
					html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#37352f;box-shadow:0 0 0 3px #fff,0 1px 4px rgba(0,0,0,.35)"></span>`,
					iconSize: [14, 14],
					iconAnchor: [7, 7],
				}),
			})
				.addTo(map)
				.bindPopup(
					`<strong>${row.name}</strong><br>${providerKindLabels[row.kind]} · ${row.place.label}`
				);
		}

		const bounds = L.latLngBounds(
			pins.map((row) => [row.place.lat as number, row.place.lng as number])
		);
		/* One pin has no extent, so fitBounds would zoom to the maximum. */
		if (pins.length === 1) map.setView(bounds.getCenter(), 13);
		else map.fitBounds(bounds, { padding: [40, 40] });

		return () => {
			map.remove();
		};
	}, [providers]);

	if (pins.length === 0) {
		return (
			<p className="text-muted-foreground rounded-lg border border-dashed px-3 py-10 text-center text-[12px]">
				No provider has coordinates yet. Saving a row with an address geocodes it.
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			<div ref={holder} className="h-[26rem] w-full overflow-hidden rounded-lg border" />
			<ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
				{pins.map((row) => (
					<li key={row.id} className="flex items-baseline gap-2 text-[13px]">
						<span
							className="bg-foreground mt-1.5 size-1.5 shrink-0 rounded-full"
							aria-hidden="true"
						/>
						<Link href={`/providers/${row.id}`} className="font-medium hover:underline">
							{row.name}
						</Link>
						<span className="text-muted-foreground text-[12px]">{row.place.label}</span>
					</li>
				))}
			</ul>
			{providers.length > pins.length ? (
				<p className="text-muted-foreground text-[12px]">
					{providers.length - pins.length} without coordinates are not on the map.
				</p>
			) : null}
		</div>
	);
}
