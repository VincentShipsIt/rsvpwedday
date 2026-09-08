import type { RsvpSubmission } from "@/domain/rsvp-schema";
import { GuestKind } from "@/generated/prisma/enums";

type InvitedGuest = {
	id: string;
	kind: GuestKind;
	addedByGuest: boolean;
	attendance: { eventId: string }[];
};

function exactlyOnce(actual: string[], expected: string[]): boolean {
	return (
		actual.length === expected.length &&
		new Set(actual).size === actual.length &&
		actual.every((id) => expected.includes(id))
	);
}

export function isRsvpPermitted(guests: InvitedGuest[], submission: RsvpSubmission): boolean {
	const named = guests.filter((guest) => !guest.addedByGuest && guest.kind === GuestKind.ADULT);
	const eventIds = [
		...new Set(guests.flatMap((guest) => guest.attendance.map((row) => row.eventId))),
	];
	if (
		!exactlyOnce(
			submission.guests.map((guest) => guest.guestId),
			named.map((guest) => guest.id)
		)
	)
		return false;
	for (const response of submission.guests) {
		const guest = named.find((candidate) => candidate.id === response.guestId);
		if (
			!guest ||
			!exactlyOnce(
				response.attendance.map((row) => row.eventId),
				guest.attendance.map((row) => row.eventId)
			)
		)
			return false;
	}
	const companionIds = submission.companions.flatMap((companion) =>
		companion.id ? [companion.id] : []
	);
	if (new Set(companionIds).size !== companionIds.length) return false;
	for (const companion of submission.companions) {
		if (
			companion.id &&
			!guests.some(
				(guest) => guest.id === companion.id && guest.addedByGuest && guest.kind === GuestKind.ADULT
			)
		)
			return false;
		if (
			companion.attendance &&
			!exactlyOnce(
				companion.attendance.map((row) => row.eventId),
				eventIds
			)
		)
			return false;
	}
	if (submission.childrenUnder12 > 0 || submission.childAttendance.length > 0) {
		if (
			!exactlyOnce(
				submission.childAttendance.map((row) => row.eventId),
				eventIds
			)
		)
			return false;
	}
	return true;
}
