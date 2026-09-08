import { z } from "zod";
import type { InvitationStatus } from "@/domain/invitation";
import { GuestKind, Locale } from "@/generated/prisma/enums";

export function parseCsvRows(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let insideQuotes = false;

	for (let i = 0; i < text.length; i += 1) {
		const char = text[i];

		if (insideQuotes) {
			if (char === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i += 1;
				} else {
					insideQuotes = false;
				}
			} else {
				field += char;
			}
			continue;
		}

		if (char === '"') {
			insideQuotes = true;
		} else if (char === ",") {
			row.push(field);
			field = "";
		} else if (char === "\n" || char === "\r") {
			if (char === "\r" && text[i + 1] === "\n") {
				i += 1;
			}
			row.push(field);
			rows.push(row);
			row = [];
			field = "";
		} else {
			field += char;
		}
	}

	if (field.length > 0 || row.length > 0) {
		row.push(field);
		rows.push(row);
	}

	return rows;
}

function serializeCsvField(value: string): string {
	if (/["\r\n,]/.test(value)) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

export function serializeCsvRow(fields: string[]): string {
	return fields.map(serializeCsvField).join(",");
}

export const IMPORT_CSV_HEADER = [
	"email",
	"locale",
	"companionAllowance",
	"firstName",
	"lastName",
	"kind",
	"guestEmail",
	"guestPhone",
	"events",
] as const;

// Event slugs in the `events` column are separated by this, since a comma would split the cell.
export const IMPORT_EVENTS_SEPARATOR = ";";

export type ImportGuestRow = {
	id?: string;
	firstName: string;
	lastName: string;
	kind: GuestKind;
	email: string | null;
	phone: string | null;
};

export const EDITABLE_IMPORT_CSV_HEADER = [
	...IMPORT_CSV_HEADER,
	"guestId",
	"childrenUnder12",
] as const;

export type ImportInvitation = {
	childrenUnder12?: number;
	email: string;
	locale: Locale;
	companionAllowance: number;
	guests: ImportGuestRow[];
	// `null` means the column was left empty: invite this household to every event.
	eventSlugs: string[] | null;
};

export type ImportCsvOptions = {
	// When known, every slug in the `events` column is checked against this list.
	eventSlugs?: string[];
};

export type ImportCsvResult = {
	invitations: ImportInvitation[];
	errors: string[];
};

function isLocale(value: string): value is Locale {
	return Object.hasOwn(Locale, value);
}

function isGuestKind(value: string): value is GuestKind {
	return Object.hasOwn(GuestKind, value);
}

export function parseImportCsv(text: string, options: ImportCsvOptions = {}): ImportCsvResult {
	const rows = parseCsvRows(text).filter((row) => row.some((cell) => cell.trim() !== ""));
	if (rows.length === 0) {
		return { invitations: [], errors: ["CSV is empty"] };
	}

	const [header, ...dataRows] = rows;
	const isHeaderValid =
		header.length >= IMPORT_CSV_HEADER.length &&
		header.length <= EDITABLE_IMPORT_CSV_HEADER.length &&
		IMPORT_CSV_HEADER.every((cell, index) => header[index]?.trim() === cell) &&
		header
			.slice(IMPORT_CSV_HEADER.length)
			.every((cell) => ["guestId", "childrenUnder12"].includes(cell.trim())) &&
		new Set(header.map((cell) => cell.trim())).size === header.length;
	if (!isHeaderValid) {
		return { invitations: [], errors: [`Header must be: ${IMPORT_CSV_HEADER.join(",")}`] };
	}

	const errors: string[] = [];
	const invitationsByEmail = new Map<string, ImportInvitation>();

	dataRows.forEach((row, index) => {
		const rowNumber = index + 2;
		if (row.length !== header.length) {
			errors.push(`Row ${rowNumber}: expected ${header.length} columns, got ${row.length}`);
			return;
		}

		const [
			email,
			localeRaw,
			allowanceRaw,
			firstName,
			lastName,
			kindRaw,
			guestEmail,
			guestPhone,
			eventsRaw,
		] = row.map((cell) => cell.trim());

		if (!z.email().safeParse(email).success) {
			errors.push(`Row ${rowNumber}: a valid household email is required`);
			return;
		}
		if (!isLocale(localeRaw)) {
			errors.push(`Row ${rowNumber}: invalid locale "${localeRaw}"`);
			return;
		}
		if (!isGuestKind(kindRaw)) {
			errors.push(`Row ${rowNumber}: invalid kind "${kindRaw}"`);
			return;
		}
		if (!firstName || !lastName) {
			errors.push(`Row ${rowNumber}: firstName and lastName are required`);
			return;
		}
		const companionAllowance = Number(allowanceRaw);
		if (
			!Number.isInteger(companionAllowance) ||
			companionAllowance < 0 ||
			companionAllowance > 20
		) {
			errors.push(`Row ${rowNumber}: invalid companionAllowance "${allowanceRaw}"`);
			return;
		}

		const eventSlugs = eventsRaw
			? eventsRaw
					.split(IMPORT_EVENTS_SEPARATOR)
					.map((slug) => slug.trim())
					.filter((slug) => slug !== "")
			: null;
		if (eventSlugs && options.eventSlugs) {
			const unknown = eventSlugs.find((slug) => !options.eventSlugs?.includes(slug));
			if (unknown) {
				errors.push(
					`Row ${rowNumber}: unknown event "${unknown}" (use ${options.eventSlugs.join(", ")})`
				);
				return;
			}
		}

		const guestIdIndex = header.findIndex((cell) => cell.trim() === "guestId");
		const childIndex = header.findIndex((cell) => cell.trim() === "childrenUnder12");
		const childRaw = childIndex >= 0 ? row[childIndex].trim() : "";
		const childrenUnder12 = childRaw === "" ? undefined : Number(childRaw);
		if (
			childrenUnder12 !== undefined &&
			(!Number.isInteger(childrenUnder12) || childrenUnder12 < 0 || childrenUnder12 > 20)
		) {
			errors.push(`Row ${rowNumber}: childrenUnder12 must be a whole number from 0 to 20`);
			return;
		}
		if (childrenUnder12 !== undefined && kindRaw === GuestKind.CHILD) {
			errors.push(`Row ${rowNumber}: use the child count instead of named CHILD rows`);
			return;
		}
		const householdEmail = email.toLowerCase();
		const invitation = invitationsByEmail.get(householdEmail) ?? {
			email: householdEmail,
			childrenUnder12,
			locale: localeRaw,
			companionAllowance,
			guests: [],
			eventSlugs,
		};
		if (childrenUnder12 !== undefined) {
			if (
				invitation.childrenUnder12 !== undefined &&
				invitation.childrenUnder12 !== childrenUnder12
			) {
				errors.push(`Row ${rowNumber}: conflicting childrenUnder12 counts for the household`);
				return;
			}
			invitation.childrenUnder12 = childrenUnder12;
		}
		// Rows of one household may list events on any row; the union is what the household gets.
		if (eventSlugs) {
			invitation.eventSlugs = Array.from(
				new Set([...(invitation.eventSlugs ?? []), ...eventSlugs])
			);
		}
		invitation.guests.push({
			id: guestIdIndex >= 0 ? row[guestIdIndex].trim() || undefined : undefined,
			firstName,
			lastName,
			kind: kindRaw,
			email: guestEmail || null,
			phone: guestPhone || null,
		});
		invitationsByEmail.set(householdEmail, invitation);
	});

	return { invitations: Array.from(invitationsByEmail.values()), errors };
}

/*
 * The template the admin downloads before filling in a guest list: the exact header the importer
 * checks, plus example rows that show a household with two guests limited to some events and a
 * single guest invited to everything. The examples use a reserved example.com address so a
 * template imported by mistake is obvious in the dashboard rather than mixed in with real guests.
 */
export function serializeImportTemplateCsv(eventSlugs: string[]): string {
	const someEvents = eventSlugs.slice(0, Math.max(1, eventSlugs.length - 1));
	const lines = [
		serializeCsvRow([...EDITABLE_IMPORT_CSV_HEADER]),
		serializeCsvRow([
			"family@example.com",
			"en",
			"0",
			"Jane",
			"Doe",
			"ADULT",
			"jane@example.com",
			"+41 79 000 00 00",
			someEvents.join(IMPORT_EVENTS_SEPARATOR),
			"",
			"2",
		]),
		serializeCsvRow(["family@example.com", "en", "0", "Sam", "Doe", "ADULT", "", "", "", "", "2"]),
		serializeCsvRow([
			"friend@example.com",
			"de",
			"1",
			"Max",
			"Muster",
			"ADULT",
			"",
			"",
			"",
			"",
			"0",
		]),
	];
	return lines.join("\n");
}

export function serializeSpreadsheetCsvRow(fields: string[]): string {
	return serializeCsvRow(fields.map((value) => (/^\s*[=+@-]/.test(value) ? `'${value}` : value)));
}

export type ExportGuestRow = {
	guestId?: string;
	guestEmail?: string | null;
	guestPhone?: string | null;
	addedByGuest?: boolean;
	childrenUnder12?: number;
	note?: string | null;
	songRequest?: string | null;
	respondedAt?: string | null;
	invitationEmail: string;
	status: InvitationStatus;
	firstName: string;
	lastName: string;
	kind: GuestKind;
	dietary: string | null;
	attendanceByEventSlug: Record<string, string>;
};

export function serializeExportCsv(rows: ExportGuestRow[], eventSlugs: string[]): string {
	const header = [
		"invitationEmail",
		"status",
		"firstName",
		"lastName",
		"kind",
		"dietary",
		"guestId",
		"guestEmail",
		"guestPhone",
		"addedByGuest",
		"childrenUnder12",
		"note",
		"songRequest",
		"respondedAt",
		...eventSlugs,
	];
	const lines = [serializeSpreadsheetCsvRow(header)];

	for (const row of rows) {
		lines.push(
			serializeSpreadsheetCsvRow([
				row.invitationEmail,
				row.status,
				row.firstName,
				row.lastName,
				row.kind,
				row.dietary ?? "",
				row.guestId ?? "",
				row.guestEmail ?? "",
				row.guestPhone ?? "",
				String(row.addedByGuest ?? false),
				String(row.childrenUnder12 ?? 0),
				row.note ?? "",
				row.songRequest ?? "",
				row.respondedAt ?? "",
				...eventSlugs.map((slug) => row.attendanceByEventSlug[slug] ?? ""),
			])
		);
	}

	return lines.join("\n");
}
