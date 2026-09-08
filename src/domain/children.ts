import { Attendance, GuestKind } from "@/generated/prisma/enums";

export const MAX_CHILDREN_UNDER_12 = 20;

export type HouseholdChildren = {
	childrenUnder12?: number | null;
	childAttendance?: { eventId: string; count: number }[];
	guests: { kind?: GuestKind; attendance: { eventId: string; status: Attendance }[] }[];
};

export function childrenUnder12(
	household: Pick<HouseholdChildren, "childrenUnder12" | "guests">
): number {
	return (
		household.childrenUnder12 ??
		household.guests.filter((guest) => guest.kind === GuestKind.CHILD).length
	);
}

// Old named-child records remain intact. Once a count is saved, only the aggregate rows count.
export function childAttendanceCounts(household: HouseholdChildren): Record<string, number> {
	if (household.childrenUnder12 != null) {
		return Object.fromEntries(
			(household.childAttendance ?? []).map((row) => [row.eventId, row.count])
		);
	}
	const counts: Record<string, number> = {};
	for (const guest of household.guests) {
		if (guest.kind !== GuestKind.CHILD) continue;
		for (const row of guest.attendance) {
			counts[row.eventId] = (counts[row.eventId] ?? 0) + Number(row.status === Attendance.ACCEPTED);
		}
	}
	return counts;
}
