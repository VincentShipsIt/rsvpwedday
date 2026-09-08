import { describe, expect, it } from "vitest";
import { dayOffset, describeDayOffset, resolveWeddingDate } from "@/domain/wedding-date";

const wedding = new Date(Date.UTC(2027, 5, 12, 15, 0));

describe("resolveWeddingDate", () => {
	it("uses the date the couple set", () => {
		expect(resolveWeddingDate(wedding, [{ startsAt: new Date(Date.UTC(2020, 0, 1)) }])).toEqual({
			date: wedding,
			source: "set",
		});
	});

	it("falls back to the earliest event by date, not by list order", () => {
		const events = [
			{ startsAt: new Date(Date.UTC(2027, 5, 13, 11, 0)) },
			{ startsAt: new Date(Date.UTC(2027, 5, 11, 19, 0)) },
			{ startsAt: new Date(Date.UTC(2027, 5, 12, 15, 0)) },
		];
		expect(resolveWeddingDate(null, events)).toEqual({
			date: new Date(Date.UTC(2027, 5, 11, 19, 0)),
			source: "derived",
		});
	});

	it("has nothing to count to with no date and no events", () => {
		expect(resolveWeddingDate(null, [])).toEqual({ date: null, source: "none" });
	});
});

describe("dayOffset", () => {
	it("counts the configured wedding day across a UTC date boundary", () => {
		expect(
			dayOffset(new Date("2027-06-11T23:30:00Z"), new Date("2027-06-12T13:00:00Z"), "Europe/Berlin")
		).toBe(0);
	});
	it("is zero anywhere on the wedding day itself", () => {
		expect(dayOffset(new Date(Date.UTC(2027, 5, 12, 0, 1)), wedding)).toBe(0);
		expect(dayOffset(new Date(Date.UTC(2027, 5, 12, 23, 59)), wedding)).toBe(0);
	});

	it("counts calendar days, so late the night before is one day before", () => {
		expect(dayOffset(new Date(Date.UTC(2027, 5, 11, 23, 0)), wedding)).toBe(-1);
		expect(dayOffset(new Date(Date.UTC(2027, 5, 13, 1, 0)), wedding)).toBe(1);
	});

	it("counts across a month boundary", () => {
		expect(dayOffset(new Date(Date.UTC(2027, 4, 30, 12, 0)), wedding)).toBe(-13);
	});

	it("is unaffected by a daylight-saving shift between the two days", () => {
		// Europe/Berlin springs forward on 28 March 2027, making that day 23 hours long.
		const marchWedding = new Date(Date.UTC(2027, 2, 29, 12, 0));
		expect(dayOffset(new Date(Date.UTC(2027, 2, 27, 12, 0)), marchWedding)).toBe(-2);
	});
});

describe("describeDayOffset", () => {
	it("names the days around the wedding", () => {
		expect(describeDayOffset(0)).toBe("Wedding day");
		expect(describeDayOffset(-1)).toBe("The day before");
		expect(describeDayOffset(1)).toBe("The day after");
		expect(describeDayOffset(-3)).toBe("3 days before");
		expect(describeDayOffset(2)).toBe("2 days after");
	});
});
