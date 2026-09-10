import type { Place } from "@/lib/crm";

type NominatimHit = {
	lat: string;
	lon: string;
	display_name: string;
};

export async function geocodePlace(query: string): Promise<Place | null> {
	const q = query.trim();
	if (!q) return null;
	const url = new URL("https://nominatim.openstreetmap.org/search");
	url.searchParams.set("q", q);
	url.searchParams.set("format", "json");
	url.searchParams.set("limit", "1");
	const response = await fetch(url, {
		headers: { "User-Agent": "SayYesConsole/1.0 (studio@sayyess.com)" },
		next: { revalidate: 86400 },
	});
	if (!response.ok) return null;
	const hits = (await response.json()) as NominatimHit[];
	const hit = hits[0];
	if (!hit) return null;
	return {
		label: q.split(",")[0]?.trim() || q,
		address: hit.display_name,
		lat: Number(hit.lat),
		lng: Number(hit.lon),
	};
}

export function mapEmbedSrc(place: Place): string | null {
	if (place.lat == null || place.lng == null) return null;
	const googleKey = process.env.GOOGLE_MAPS_API_KEY;
	if (googleKey) {
		const q = encodeURIComponent(place.address || `${place.lat},${place.lng}`);
		return `https://www.google.com/maps/embed/v1/place?key=${googleKey}&q=${q}`;
	}
	const delta = 0.02;
	const { lat, lng } = place;
	const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
	return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export function mapsExternalHref(place: Place): string {
	const q = encodeURIComponent(place.address || `${place.lat},${place.lng}` || place.label);
	if (process.env.GOOGLE_MAPS_API_KEY) {
		return `https://www.google.com/maps/search/?api=1&query=${q}`;
	}
	return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
