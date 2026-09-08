/*
 * Which events a stranger may see. There are two independent filters on the event list, and mixing
 * them up is the whole risk here:
 *
 * - `filterToInvited` (`src/domain/invitation-events.ts`) answers "was this household invited?"
 *   and belongs to the RSVP page, the invitation emails and the headcount.
 * - `publicEvents` below answers "may anybody see this at all?" and belongs to the public site.
 *
 * A family-only welcome dinner is hidden from the public page but must still reach the people
 * invited to it, so the invitation surfaces never call this. Nothing here looks at attendance, and
 * nothing in `invitation-events.ts` looks at `showPublicly`.
 *
 * One more thing this must not touch: the wedding date's fallback (`resolveWeddingDate`) and the
 * admin's day-offset labels count from the calendar, not from what is on display, so they keep
 * reading the whole list. Hiding the welcome dinner must not move the countdown.
 */

export type PubliclyVisible = { showPublicly: boolean };

export function publicEvents<T extends PubliclyVisible>(events: T[]): T[] {
	return events.filter((event) => event.showPublicly);
}
