import { format, parse } from "date-fns";

/*
 * The one string shape every date field in the admin passes over the wire: `2027-06-12T15:00`,
 * with no zone, written and read back in the same zone. Server pages format a stored instant into
 * it and server actions parse it with `new Date(...)`, so a value must never be built from
 * `toISOString()` — that is UTC, and an evening in Berlin would come back showing the wrong hour,
 * or near midnight the wrong day.
 */
const WIRE_FORMAT = "yyyy-MM-dd'T'HH:mm";

export function toWireDate(value: Date): string {
	return format(value, WIRE_FORMAT);
}

export function toWireDateOrEmpty(value: Date | null | undefined): string {
	return value ? toWireDate(value) : "";
}

export function parseWireDate(value: string): Date | null {
	if (!value) {
		return null;
	}
	const parsed = parse(value, WIRE_FORMAT, new Date());
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}
