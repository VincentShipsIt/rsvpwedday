import { describe, expect, it } from "vitest";
import {
	EDITABLE_IMPORT_CSV_HEADER,
	IMPORT_CSV_HEADER,
	parseCsvRows,
	parseImportCsv,
	serializeCsvRow,
	serializeExportCsv,
	serializeImportTemplateCsv,
	serializeSpreadsheetCsvRow,
} from "@/domain/csv";
import { GuestKind, Locale } from "@/generated/prisma/enums";

describe("parseCsvRows", () => {
	it("splits plain rows on commas and newlines", () => {
		expect(parseCsvRows("a,b\nc,d")).toEqual([
			["a", "b"],
			["c", "d"],
		]);
	});

	it("keeps commas and newlines inside quoted fields", () => {
		expect(parseCsvRows('"Doe, Jane","line1\nline2"\nx,y')).toEqual([
			["Doe, Jane", "line1\nline2"],
			["x", "y"],
		]);
	});

	it("unescapes doubled quotes inside a quoted field", () => {
		expect(parseCsvRows('"She said ""hi"""')).toEqual([['She said "hi"']]);
	});
});

describe("serializeCsvRow", () => {
	it("quotes a field containing a comma", () => {
		expect(serializeCsvRow(["Doe, Jane", "plain"])).toBe('"Doe, Jane",plain');
	});

	it("escapes quotes by doubling them", () => {
		expect(serializeCsvRow(['She said "hi"'])).toBe('"She said ""hi"""');
	});
});

describe("parseImportCsv", () => {
	it("rejects a mismatched header", () => {
		const result = parseImportCsv("wrong,header");
		expect(result.errors).toHaveLength(1);
		expect(result.invitations).toEqual([]);
	});

	it("merges rows sharing an email into one invitation", () => {
		const text = [
			IMPORT_CSV_HEADER.join(","),
			"a@example.com,en,1,Jane,Doe,ADULT,,,",
			"a@example.com,en,1,Jack,Doe,CHILD,,,",
			"b@example.com,de,0,Max,Muster,ADULT,max@example.com,,",
		].join("\n");

		const result = parseImportCsv(text);

		expect(result.errors).toEqual([]);
		expect(result.invitations).toHaveLength(2);

		const first = result.invitations.find((invitation) => invitation.email === "a@example.com");
		expect(first?.locale).toBe(Locale.en);
		expect(first?.companionAllowance).toBe(1);
		expect(first?.guests).toHaveLength(2);
		expect(first?.guests[1]?.kind).toBe(GuestKind.CHILD);

		const second = result.invitations.find((invitation) => invitation.email === "b@example.com");
		expect(second?.guests[0]?.email).toBe("max@example.com");
		expect(second?.guests[0]?.phone).toBeNull();
		expect(first?.eventSlugs).toBeNull();
	});

	it("reads the events column as a union across a household's rows", () => {
		const text = [
			IMPORT_CSV_HEADER.join(","),
			"a@example.com,en,0,Jane,Doe,ADULT,,,ceremony;reception",
			"a@example.com,en,0,Jack,Doe,CHILD,,,ceremony",
		].join("\n");
		const result = parseImportCsv(text, { eventSlugs: ["ceremony", "reception", "brunch"] });
		expect(result.errors).toEqual([]);
		expect(result.invitations[0]?.eventSlugs).toEqual(["ceremony", "reception"]);
	});

	it("rejects an event slug the site does not have", () => {
		const text = [IMPORT_CSV_HEADER.join(","), "a@example.com,en,0,Jane,Doe,ADULT,,,party"].join(
			"\n"
		);
		const result = parseImportCsv(text, { eventSlugs: ["ceremony"] });
		expect(result.errors[0]).toContain('unknown event "party"');
	});

	it("produces a template the importer accepts", () => {
		const template = serializeImportTemplateCsv(["ceremony", "reception", "brunch"]);
		const result = parseImportCsv(template, { eventSlugs: ["ceremony", "reception", "brunch"] });
		expect(result.errors).toEqual([]);
		expect(result.invitations).toHaveLength(2);
		expect(result.invitations[0]?.eventSlugs).toEqual(["ceremony", "reception"]);
		expect(result.invitations[1]?.eventSlugs).toBeNull();
	});

	it("reports an invalid locale on its own row without dropping other rows", () => {
		const text = [
			IMPORT_CSV_HEADER.join(","),
			"a@example.com,fr,0,Jane,Doe,ADULT,,,",
			"b@example.com,en,0,Max,Muster,ADULT,,,",
		].join("\n");

		const result = parseImportCsv(text);

		expect(result.errors).toEqual(['Row 2: invalid locale "fr"']);
		expect(result.invitations).toHaveLength(1);
		expect(result.invitations[0]?.email).toBe("b@example.com");
	});
});

describe("serializeExportCsv", () => {
	it("writes one row per guest with per-event attendance columns", () => {
		const csv = serializeExportCsv(
			[
				{
					invitationEmail: "a@example.com",
					status: "accepted",
					firstName: "Jane",
					lastName: "Doe",
					kind: GuestKind.ADULT,
					dietary: "vegetarian",
					attendanceByEventSlug: { wedding: "ACCEPTED" },
				},
			],
			["wedding", "brunch"]
		);

		expect(csv).toBe(
			"invitationEmail,status,firstName,lastName,kind,dietary,guestId,guestEmail,guestPhone,addedByGuest,childrenUnder12,note,songRequest,respondedAt,wedding,brunch\n" +
				"a@example.com,accepted,Jane,Doe,ADULT,vegetarian,,,,false,0,,,,ACCEPTED,"
		);
	});
});

describe("extended import columns", () => {
	it("accepts a stable ID and a household child count while normalizing the email", () => {
		const csv = [
			EDITABLE_IMPORT_CSV_HEADER.join(","),
			"A@Example.com,en,2,Jane,Doe,ADULT,,,ceremony,guest-1,2",
		].join("\n");
		const result = parseImportCsv(csv);
		expect(result.errors).toEqual([]);
		expect(result.invitations[0]).toMatchObject({
			email: "a@example.com",
			childrenUnder12: 2,
			guests: [{ id: "guest-1" }],
		});
	});
	it("keeps omitted or blank child counts unspecified", () => {
		const csv = [
			EDITABLE_IMPORT_CSV_HEADER.join(","),
			"a@example.com,en,2,Jane,Doe,ADULT,,,ceremony,guest-1,",
		].join("\n");
		expect(parseImportCsv(csv).invitations[0].childrenUnder12).toBeUndefined();
	});
	it("rejects conflicting household metadata and mixed child representations", () => {
		const header = EDITABLE_IMPORT_CSV_HEADER.join(",");
		expect(
			parseImportCsv(
				[
					header,
					"a@example.com,en,2,Jane,Doe,ADULT,,,,,2",
					"a@example.com,de,2,Sam,Doe,ADULT,,,,,2",
				].join("\n")
			).errors[0]
		).toContain("conflicting locale");
		expect(
			parseImportCsv(
				[
					header,
					"a@example.com,en,2,Jane,Doe,ADULT,,,,,2",
					"a@example.com,en,2,Sam,Doe,CHILD,,,,,",
				].join("\n")
			).errors[0]
		).toContain("either childrenUnder12");
	});
	it("accepts a UTF-8 BOM from spreadsheet downloads", () => {
		expect(
			parseImportCsv(`\uFEFF${IMPORT_CSV_HEADER.join(",")}\na@example.com,en,0,Jane,Doe,ADULT,,,`)
				.errors
		).toEqual([]);
	});
});

describe("spreadsheet export safety", () => {
	it("round-trips CR, LF, CRLF, commas, quotes and Unicode within a single row", () => {
		const fields = [
			"one\rtwo",
			"one\ntwo",
			"one\r\ntwo",
			"Doe, Jane",
			'A "quote"',
			"Şêrîn — Grüezi",
		];
		expect(parseCsvRows(serializeCsvRow(fields))).toEqual([fields]);
	});
	it("keeps formula-like text and international phone numbers literal, without changing machine CSV", () => {
		const fields = ["=1+1", "+41 79 123 45 67", "-12", "@name", " \t=1+1", "plain"];
		expect(parseCsvRows(serializeSpreadsheetCsvRow(fields))[0]).toEqual([
			"'=1+1",
			"'+41 79 123 45 67",
			"'-12",
			"'@name",
			"' \t=1+1",
			"plain",
		]);
		expect(parseCsvRows(serializeCsvRow(fields))[0]).toEqual(fields);
	});
	it("exports reply details, companion contacts and child counts in stable columns", () => {
		const rows = parseCsvRows(
			serializeExportCsv(
				[
					{
						invitationEmail: "family@example.com",
						status: "accepted",
						firstName: "Sam",
						lastName: "Doe",
						kind: GuestKind.ADULT,
						dietary: "No nuts\rNo dairy",
						guestId: "guest-2",
						guestEmail: "sam@example.com",
						guestPhone: "+41 79",
						addedByGuest: true,
						childrenUnder12: 2,
						note: "=1+1",
						songRequest: "Şêrîn",
						respondedAt: "2026-09-08T12:00:00Z",
						attendanceByEventSlug: { ceremony: "ACCEPTED" },
					},
				],
				["ceremony"]
			)
		);
		expect(rows).toHaveLength(2);
		const record = Object.fromEntries(rows[0].map((key, index) => [key, rows[1][index]]));
		expect(record).toMatchObject({
			guestId: "guest-2",
			guestPhone: "'+41 79",
			childrenUnder12: "2",
			addedByGuest: "true",
			note: "'=1+1",
			dietary: "No nuts\rNo dairy",
			ceremony: "ACCEPTED",
		});
	});
});
