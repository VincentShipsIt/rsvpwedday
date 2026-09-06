import { describe, expect, it } from "vitest";
import { computeHeadcount, type HeadcountInvitationInput } from "@/domain/headcount";
import { Attendance, GuestKind } from "@/generated/prisma/client";

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
