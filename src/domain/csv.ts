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
	if (/["\n,]/.test(value)) {
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
	firstName: string;
	lastName: string;
	kind: GuestKind;
	email: string | null;
	phone: string | null;
};

export type ImportInvitation = {
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
		header.length === IMPORT_CSV_HEADER.length &&
		header.every((cell, index) => cell.trim() === IMPORT_CSV_HEADER[index]);
	if (!isHeaderValid) {
		return { invitations: [], errors: [`Header must be: ${IMPORT_CSV_HEADER.join(",")}`] };
	}

	const errors: string[] = [];
	const invitationsByEmail = new Map<string, ImportInvitation>();

	dataRows.forEach((row, index) => {
		const rowNumber = index + 2;
		if (row.length !== IMPORT_CSV_HEADER.length) {
			errors.push(
				`Row ${rowNumber}: expected ${IMPORT_CSV_HEADER.length} columns, got ${row.length}`
			);
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

		if (!email) {
			errors.push(`Row ${rowNumber}: email is required`);
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
		if (!Number.isInteger(companionAllowance) || companionAllowance < 0) {
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

		const invitation = invitationsByEmail.get(email) ?? {
			email,
			locale: localeRaw,
			companionAllowance,
			guests: [],
			eventSlugs,
		};
		// Rows of one household may list events on any row; the union is what the household gets.
		if (eventSlugs) {
			invitation.eventSlugs = Array.from(
				new Set([...(invitation.eventSlugs ?? []), ...eventSlugs])
			);
		}
		invitation.guests.push({
			firstName,
			lastName,
			kind: kindRaw,
			email: guestEmail || null,
			phone: guestPhone || null,
		});
		invitationsByEmail.set(email, invitation);
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
		serializeCsvRow([...IMPORT_CSV_HEADER]),
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
		]),
		serializeCsvRow(["family@example.com", "en", "0", "Sam", "Doe", "CHILD", "", "", ""]),
		serializeCsvRow(["friend@example.com", "de", "1", "Max", "Muster", "ADULT", "", "", ""]),
	];
	return lines.join("\n");
}

export type ExportGuestRow = {
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
		...eventSlugs,
	];
	const lines = [serializeCsvRow(header)];

	for (const row of rows) {
		lines.push(
			serializeCsvRow([
				row.invitationEmail,
				row.status,
				row.firstName,
				row.lastName,
				row.kind,
				row.dietary ?? "",
				...eventSlugs.map((slug) => row.attendanceByEventSlug[slug] ?? ""),
			])
		);
	}

	return lines.join("\n");
}
