import { describe, expect, it } from "vitest";
import { isRsvpPermitted } from "@/domain/rsvp-permissions";
import { createRsvpSubmissionSchema } from "@/domain/rsvp-schema";
import { GuestKind } from "@/generated/prisma/enums";

const invited = [
	{
		id: "adult-a",
		kind: GuestKind.ADULT,
		addedByGuest: false,
		attendance: [{ eventId: "ceremony" }, { eventId: "brunch" }],
	},
	{
		id: "adult-b",
		kind: GuestKind.ADULT,
		addedByGuest: false,
		attendance: [{ eventId: "ceremony" }],
	},
	{
		id: "legacy-child",
		kind: GuestKind.CHILD,
		addedByGuest: false,
		attendance: [{ eventId: "ceremony" }],
	},
	{
		id: "existing-plus-one",
		kind: GuestKind.ADULT,
		addedByGuest: true,
		attendance: [{ eventId: "ceremony" }, { eventId: "brunch" }],
	},
];
function response() {
	return createRsvpSubmissionSchema(2).parse({
		guests: [
			{
				guestId: "adult-a",
				attendance: [
					{ eventId: "ceremony", attending: true },
					{ eventId: "brunch", attending: false },
				],
			},
			{ guestId: "adult-b", attendance: [{ eventId: "ceremony", attending: false }] },
		],
		companions: [],
		childrenUnder12: 2,
		childAttendance: [
			{ eventId: "ceremony", count: 2 },
			{ eventId: "brunch", count: 1 },
		],
	});
}
function companion(id?: string) {
	return {
		...(id ? { id } : {}),
		firstName: "Fixture",
		lastName: "Companion",
		kind: GuestKind.ADULT,
		email: "fixture@example.test",
		attendance: [
			{ eventId: "ceremony", attending: true },
			{ eventId: "brunch", attending: false },
		],
	};
}

describe("RSVP household authorization", () => {
	it("accepts complete independent answers without requiring legacy child names", () => {
		expect(isRsvpPermitted(invited, response())).toBe(true);
	});
	it("allows a valid subset invitation to decline independently", () => {
		const submission = response();
		submission.guests.reverse();
		submission.childAttendance.reverse();
		expect(isRsvpPermitted(invited, submission)).toBe(true);
	});
	it.each(["foreign-adult", "legacy-child", "existing-plus-one"])(
		"rejects %s as a named invited adult",
		(guestId) => {
			const submission = response();
			submission.guests[1].guestId = guestId;
			expect(isRsvpPermitted(invited, submission)).toBe(false);
		}
	);
	it("rejects duplicated adult answers that omit another household member", () => {
		const submission = response();
		submission.guests[1] = submission.guests[0];
		expect(isRsvpPermitted(invited, submission)).toBe(false);
	});
	it("rejects an omitted named adult", () => {
		const submission = response();
		submission.guests.pop();
		expect(isRsvpPermitted(invited, submission)).toBe(false);
	});
	it.each(["missing", "duplicate", "uninvited"])(
		"rejects %s event answers on a named adult",
		(variant) => {
			const submission = response();
			if (variant === "missing") submission.guests[0].attendance.pop();
			if (variant === "duplicate") submission.guests[0].attendance[1].eventId = "ceremony";
			if (variant === "uninvited") submission.guests[1].attendance[0].eventId = "brunch";
			expect(isRsvpPermitted(invited, submission)).toBe(false);
		}
	);
	it.each([undefined, "existing-plus-one"])(
		"accepts a new or retained adult companion (%s)",
		(id) => {
			const submission = response();
			submission.companions = [companion(id)];
			expect(isRsvpPermitted(invited, submission)).toBe(true);
		}
	);
	it.each(["foreign-companion", "adult-a", "legacy-child"])(
		"rejects modifying %s through the companion list",
		(id) => {
			const submission = response();
			submission.companions = [companion(id)];
			expect(isRsvpPermitted(invited, submission)).toBe(false);
		}
	);
	it("rejects duplicate retained companion IDs", () => {
		const submission = response();
		submission.companions = [companion("existing-plus-one"), companion("existing-plus-one")];
		expect(isRsvpPermitted(invited, submission)).toBe(false);
	});
	it.each(["missing", "duplicate", "foreign"])("rejects %s companion event answers", (variant) => {
		const submission = response();
		const added = companion();
		if (variant === "missing") added.attendance.pop();
		if (variant === "duplicate") added.attendance[1].eventId = "ceremony";
		if (variant === "foreign") added.attendance[1].eventId = "private-dinner";
		submission.companions = [added];
		expect(isRsvpPermitted(invited, submission)).toBe(false);
	});
	it.each(["missing", "duplicate", "foreign"])(
		"rejects %s aggregate child event answers",
		(variant) => {
			const submission = response();
			if (variant === "missing") submission.childAttendance.pop();
			if (variant === "duplicate") submission.childAttendance[1].eventId = "ceremony";
			if (variant === "foreign") submission.childAttendance[1].eventId = "private-dinner";
			expect(isRsvpPermitted(invited, submission)).toBe(false);
		}
	);
	it("permits removing the last child without retaining event answers", () => {
		const submission = response();
		submission.childrenUnder12 = 0;
		submission.childAttendance = [];
		expect(isRsvpPermitted(invited, submission)).toBe(true);
	});
});
