import { describe, expect, it } from "vitest";
import { computeHeadcount, type HeadcountInvitationInput } from "@/domain/headcount";
import { Attendance, GuestKind } from "@/generated/prisma/enums";

const events = [{ id: "wedding" }, { id: "brunch" }];

describe("computeHeadcount", () => {
	it("tallies invitation status and per-event accepted headcounts", () => {
		const invitations: HeadcountInvitationInput[] = [
			{
				respondedAt: null,
				guests: [
					{
						kind: GuestKind.ADULT,
						attendance: [
							{ eventId: "wedding", status: Attendance.PENDING },
							{ eventId: "brunch", status: Attendance.PENDING },
						],
					},
				],
			},
			{
				respondedAt: new Date(),
				guests: [
					{
						kind: GuestKind.ADULT,
						attendance: [
							{ eventId: "wedding", status: Attendance.ACCEPTED },
							{ eventId: "brunch", status: Attendance.DECLINED },
						],
					},
					{
						kind: GuestKind.CHILD,
						attendance: [{ eventId: "wedding", status: Attendance.ACCEPTED }],
					},
				],
			},
			{
				respondedAt: new Date(),
				guests: [
					{
						kind: GuestKind.ADULT,
						attendance: [{ eventId: "wedding", status: Attendance.DECLINED }],
					},
				],
			},
		];

		const headcount = computeHeadcount(invitations, events);

		expect(headcount.invitations).toEqual({ pending: 1, accepted: 1, declined: 1 });
		expect(headcount.attendingOverall).toEqual({ adults: 1, children: 1 });
		expect(headcount.byEvent.wedding).toEqual({ adults: 1, children: 1 });
		expect(headcount.byEvent.brunch).toEqual({ adults: 0, children: 0 });
	});

	it("returns zeroed buckets for every known event when there are no invitations", () => {
		const headcount = computeHeadcount([], events);
		expect(headcount.byEvent).toEqual({
			wedding: { adults: 0, children: 0 },
			brunch: { adults: 0, children: 0 },
		});
	});
});

describe("family headcounts", () => {
	it("counts the highest attending child total once overall and exact totals per event", () => {
		const count = computeHeadcount(
			[
				{
					respondedAt: new Date(),
					childrenUnder12: 4,
					guests: [],
					childAttendance: [
						{ eventId: "wedding", count: 3 },
						{ eventId: "brunch", count: 2 },
					],
				},
			],
			events
		);
		expect(count.attendingOverall).toEqual({ adults: 0, children: 3 });
		expect(count.byEvent.wedding.children).toBe(3);
		expect(count.byEvent.brunch.children).toBe(2);
	});
	it("does not double-count archived named children after conversion", () => {
		const count = computeHeadcount(
			[
				{
					respondedAt: new Date(),
					childrenUnder12: 2,
					guests: [
						{
							kind: GuestKind.CHILD,
							attendance: [{ eventId: "wedding", status: Attendance.ACCEPTED }],
						},
					],
					childAttendance: [{ eventId: "wedding", count: 2 }],
				},
			],
			events
		);
		expect(count.attendingOverall.children).toBe(2);
		expect(count.byEvent.wedding.children).toBe(2);
	});
	it("retains distinct legacy children attending disjoint events", () => {
		const count = computeHeadcount(
			[
				{
					respondedAt: new Date(),
					childrenUnder12: null,
					guests: [
						{
							kind: GuestKind.CHILD,
							attendance: [{ eventId: "wedding", status: Attendance.ACCEPTED }],
						},
						{
							kind: GuestKind.CHILD,
							attendance: [{ eventId: "brunch", status: Attendance.ACCEPTED }],
						},
					],
				},
			],
			events
		);
		expect(count.attendingOverall.children).toBe(2);
		expect(count.byEvent.wedding.children).toBe(1);
		expect(count.byEvent.brunch.children).toBe(1);
	});
	it("counts a legacy child attending multiple events only once overall", () => {
		const count = computeHeadcount(
			[
				{
					respondedAt: new Date(),
					guests: [
						{
							kind: GuestKind.CHILD,
							attendance: [
								{ eventId: "wedding", status: Attendance.ACCEPTED },
								{ eventId: "brunch", status: Attendance.ACCEPTED },
							],
						},
					],
				},
			],
			events
		);
		expect(count.attendingOverall.children).toBe(1);
	});
	it("keeps an unresponded household pending without counting its total as accepted", () => {
		const count = computeHeadcount(
			[{ respondedAt: null, childrenUnder12: 3, guests: [], childAttendance: [] }],
			events
		);
		expect(count.invitations.pending).toBe(1);
		expect(count.attendingOverall.children).toBe(0);
	});
});
