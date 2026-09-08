import { describe, expect, it } from "vitest";
import { computeCountdown } from "@/domain/countdown";

describe("countdown calendar states", () => {
	const target = Date.parse("2026-09-08T20:00:00Z");
	it("counts down before the ceremony", () => {
		expect(computeCountdown(target, target - 90000, "Europe/Malta")).toEqual({
			days: 0,
			hours: 0,
			minutes: 1,
			seconds: 30,
		});
	});
	it("shows today after the ceremony only for the wedding's local date", () => {
		expect(computeCountdown(target, Date.parse("2026-09-08T21:59:00Z"), "Europe/Malta")).toBe(
			"today"
		);
		expect(computeCountdown(target, Date.parse("2026-09-08T22:00:00Z"), "Europe/Malta")).toBe(
			"past"
		);
		expect(computeCountdown(target, Date.parse("2027-01-01T00:00:00Z"), "Europe/Malta")).toBe(
			"past"
		);
	});
});
