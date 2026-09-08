import { describe, expect, it } from "vitest";
import { formatDateTime } from "@/lib/format";
import { isTimeZone, parseWireDate, parseWireDatePreserving, toWireDate } from "@/lib/wire-date";

describe("wedding timezone", () => {
	it("preserves an unchanged instant in the second autumn occurrence, including seconds", () => {
		const previous = new Date("2027-10-31T01:30:42Z");
		expect(parseWireDatePreserving("2027-10-31T02:30", "Europe/Berlin", previous)).toBe(previous);
	});
	it.each([
		["2027-06-12T15:00", "2027-06-12T13:00:00.000Z"],
		["2027-01-12T15:00", "2027-01-12T14:00:00.000Z"],
	])("converts Berlin wall time %s into the calendar instant", (wall, instant) => {
		const parsed = parseWireDate(wall, "Europe/Berlin");
		expect(parsed?.toISOString()).toBe(instant);
		expect(toWireDate(parsed as Date, "Europe/Berlin")).toBe(wall);
		expect(formatDateTime(parsed as Date, "en", "Europe/Berlin")).toContain("15:00");
	});
	it("rejects invalid dates and spring-forward times instead of silently moving them", () => {
		for (const wall of ["2027-02-30T15:00", "2027-03-28T02:30", "2027-06-12T25:00", ""]) {
			expect(parseWireDate(wall, "Europe/Berlin")).toBeNull();
		}
	});
	it("consistently chooses the first autumn occurrence", () => {
		expect(parseWireDate("2027-10-31T02:30", "Europe/Berlin")?.toISOString()).toBe(
			"2027-10-31T00:30:00.000Z"
		);
	});
	it("supports non-hour offsets and dates on another local day", () => {
		expect(parseWireDate("2027-06-12T00:15", "Asia/Kathmandu")?.toISOString()).toBe(
			"2027-06-11T18:30:00.000Z"
		);
	});
	it("preserves UTC defaults and rejects unknown zones", () => {
		expect(parseWireDate("2027-06-12T15:00")?.toISOString()).toBe("2027-06-12T15:00:00.000Z");
		expect(isTimeZone("Not/AZone")).toBe(false);
		expect(parseWireDate("2027-06-12T15:00", "Not/AZone")).toBeNull();
	});
});
