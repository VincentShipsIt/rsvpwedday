import { describe, expect, it } from "vitest";
import { childAttendanceCounts, childrenUnder12 } from "@/domain/children";
import { Attendance, GuestKind } from "@/generated/prisma/enums";

const guests = [
	{ kind: GuestKind.ADULT, attendance: [{ eventId: "ceremony", status: Attendance.ACCEPTED }] },
	{
		kind: GuestKind.CHILD,
		attendance: [
			{ eventId: "ceremony", status: Attendance.ACCEPTED },
			{ eventId: "brunch", status: Attendance.DECLINED },
		],
	},
	{
		kind: GuestKind.CHILD,
		attendance: [
			{ eventId: "ceremony", status: Attendance.PENDING },
			{ eventId: "brunch", status: Attendance.ACCEPTED },
		],
	},
];

describe("household children", () => {
	it.each([undefined, null])("derives legacy named children when the count is %s", (count) => {
		expect(childrenUnder12({ childrenUnder12: count, guests })).toBe(2);
		expect(childAttendanceCounts({ childrenUnder12: count, guests })).toEqual({
			ceremony: 1,
			brunch: 1,
		});
	});
	it("counts only under-12 totals once a household has switched to the new workflow", () => {
		const household = {
			childrenUnder12: 3,
			guests,
			childAttendance: [
				{ eventId: "ceremony", count: 3 },
				{ eventId: "brunch", count: 2 },
			],
		};
		expect(childrenUnder12(household)).toBe(3);
		expect(childAttendanceCounts(household)).toEqual({ ceremony: 3, brunch: 2 });
	});
	it("treats explicit zero as authoritative without reviving archived named children", () => {
		expect(childrenUnder12({ childrenUnder12: 0, guests })).toBe(0);
		expect(childAttendanceCounts({ childrenUnder12: 0, guests, childAttendance: [] })).toEqual({});
	});
	it("does not count a household child total as an RSVP by itself", () => {
		expect(childAttendanceCounts({ childrenUnder12: 3, guests: [], childAttendance: [] })).toEqual(
			{}
		);
	});
	it("ignores aggregate rows until a legacy household has explicitly switched", () => {
		expect(
			childAttendanceCounts({
				childrenUnder12: null,
				guests,
				childAttendance: [{ eventId: "ceremony", count: 20 }],
			})
		).toEqual({ ceremony: 1, brunch: 1 });
	});
});
