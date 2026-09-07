import { describe, expect, it } from "vitest";
import {
	IMPORT_CSV_HEADER,
	parseCsvRows,
	parseImportCsv,
	serializeCsvRow,
	serializeExportCsv,
	serializeImportTemplateCsv,
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
			"invitationEmail,status,firstName,lastName,kind,dietary,wedding,brunch\n" +
				"a@example.com,accepted,Jane,Doe,ADULT,vegetarian,ACCEPTED,"
		);
	});
});
