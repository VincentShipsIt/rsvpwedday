import type { Place } from "@/lib/crm";
import { mapEmbedSrc, mapsExternalHref } from "@/lib/geocode";

export function PlaceMap({ place }: { place: Place }) {
	const src = mapEmbedSrc(place);
	if (!src) {
		return (
			<p className="text-muted-foreground text-sm">
				No coordinates yet. Save with an address to geocode.
			</p>
		);
	}
	return (
		<div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
			<iframe
				title={`Map of ${place.label}`}
				src={src}
				className="h-64 w-full border-0"
				loading="lazy"
				referrerPolicy="no-referrer-when-downgrade"
			/>
			<p className="bg-card px-3 py-2 text-xs">
				<a
					href={mapsExternalHref(place)}
					className="text-foreground underline-offset-2 hover:underline"
					target="_blank"
					rel="noreferrer"
				>
					Open in Google Maps
				</a>
				{place.address ? <span className="text-muted-foreground"> · {place.address}</span> : null}
			</p>
		</div>
	);
}
