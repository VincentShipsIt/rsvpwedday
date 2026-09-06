import { getInvitationStatus, type InvitationStatusInput } from "@/domain/invitation";
import { Attendance, GuestKind } from "@/generated/prisma/enums";

export type HeadcountGuestInput = {
	kind: GuestKind;
	attendance: { eventId: string; status: Attendance }[];
};

export type HeadcountInvitationInput = InvitationStatusInput & {
	guests: HeadcountGuestInput[];
};

export type AgeGroupCounts = {
	adults: number;
	children: number;
};

export type Headcount = {
	invitations: {
		pending: number;
		accepted: number;
		declined: number;
	};
	attendingOverall: AgeGroupCounts;
	byEvent: Record<string, AgeGroupCounts>;
};

function emptyAgeGroupCounts(): AgeGroupCounts {
	return { adults: 0, children: 0 };
}

export function computeHeadcount(
	invitations: HeadcountInvitationInput[],
	events: { id: string }[]
): Headcount {
	const headcount: Headcount = {
		invitations: { pending: 0, accepted: 0, declined: 0 },
		attendingOverall: emptyAgeGroupCounts(),
		byEvent: {},
	};

	for (const event of events) {
		headcount.byEvent[event.id] = emptyAgeGroupCounts();
	}

	for (const invitation of invitations) {
		headcount.invitations[getInvitationStatus(invitation)] += 1;

		for (const guest of invitation.guests) {
			const overallBucket = guest.kind === GuestKind.ADULT ? "adults" : "children";
			const isAttendingAnyEvent = guest.attendance.some(
				(attendance) => attendance.status === Attendance.ACCEPTED
			);
			if (isAttendingAnyEvent) {
				headcount.attendingOverall[overallBucket] += 1;
			}

			for (const attendance of guest.attendance) {
				if (attendance.status !== Attendance.ACCEPTED) {
					continue;
				}
				if (!headcount.byEvent[attendance.eventId]) {
					headcount.byEvent[attendance.eventId] = emptyAgeGroupCounts();
				}
				headcount.byEvent[attendance.eventId][overallBucket] += 1;
			}
		}
	}

	return headcount;
}
