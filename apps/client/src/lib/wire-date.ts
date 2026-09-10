export const DEFAULT_TIME_ZONE = "UTC";

export function isTimeZone(value: string): boolean {
	try {
		new Intl.DateTimeFormat("en", { timeZone: value }).format(0);
		return Boolean(value);
	} catch {
		return false;
	}
}

export function toWireDate(value: Date, timeZone = DEFAULT_TIME_ZONE): string {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).formatToParts(value);
	const get = (type: string) => parts.find((part) => part.type === type)?.value;
	return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function toWireDateOrEmpty(
	value: Date | null | undefined,
	timeZone = DEFAULT_TIME_ZONE
): string {
	return value ? toWireDate(value, timeZone) : "";
}

// Enumerate the offsets on both sides of a possible transition. Round-trip validation rejects
// nonexistent spring-forward times; an autumn overlap consistently chooses its first occurrence.
export function parseWireDate(value: string, timeZone = DEFAULT_TIME_ZONE): Date | null {
	if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || !isTimeZone(timeZone)) return null;
	const wall = new Date(`${value}:00.000Z`);
	if (Number.isNaN(wall.getTime()) || wall.toISOString().slice(0, 16) !== value) return null;
	const offsets = new Set<number>();
	for (const hours of [-48, -24, 0, 24, 48]) {
		const sample = new Date(wall.getTime() + hours * 3_600_000);
		offsets.add(new Date(`${toWireDate(sample, timeZone)}:00.000Z`).getTime() - sample.getTime());
	}
	const candidates = [...offsets]
		.map((offset) => new Date(wall.getTime() - offset))
		.filter((candidate) => toWireDate(candidate, timeZone) === value)
		.sort((a, b) => a.getTime() - b.getTime());
	return candidates[0] ?? null;
}

// A wall-time field has minute precision and cannot distinguish the second autumn occurrence.
// Retain its stored instant when it still displays the submitted value, including seconds.
export function parseWireDatePreserving(
	value: string,
	timeZone: string,
	previous: Date | null | undefined
): Date | null {
	if (previous && isTimeZone(timeZone) && toWireDate(previous, timeZone) === value) return previous;
	return parseWireDate(value, timeZone);
}
