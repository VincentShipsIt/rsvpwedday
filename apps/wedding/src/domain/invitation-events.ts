/*
 * Which events an invitation covers is not stored on the invitation: it is the set of events its
 * guests hold attendance rows for. A guest with no row for an event was never invited to it, so
 * the RSVP page, the emails and the headcount all leave it out. This is the one place that
 * derives the set; keep every consumer on it so they cannot drift.
 */
export type InvitedGuestInput = { attendance: { eventId: string }[] };

export function invitedEventIds(guests: InvitedGuestInput[]): string[] {
	const ids = new Set<string>();
	for (const guest of guests) {
		for (const attendance of guest.attendance) {
			ids.add(attendance.eventId);
		}
	}
	return Array.from(ids);
}

// Keeps a list of events in the site's own order rather than the order ids happened to arrive.
export function filterToInvited<T extends { id: string }>(events: T[], eventIds: string[]): T[] {
	const invited = new Set(eventIds);
	return events.filter((event) => invited.has(event.id));
}
