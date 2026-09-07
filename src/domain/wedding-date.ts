/*
 * The wedding day, and how every other date on the site relates to it.
 *
 * Events are not derived from this date. A wedding weekend has a henna night the evening before
 * and a brunch the morning after, so each event keeps its own absolute `startsAt` and may fall on
 * either side. What the wedding date gives us is the one thing an event list cannot: which of
 * those days is *the* day — the countdown's target, and the day the photo book opens.
 */

export type DatedEvent = { startsAt: Date };

export type WeddingDate =
	/** The couple set it explicitly. */
	| { date: Date; source: "set" }
	/**
	 * Not set yet, so the earliest event stands in. Ordered by date, never by the admin's own
	 * sort order, which is a display preference and can disagree with the calendar.
	 */
	| { date: Date; source: "derived" }
	/** Nothing to count to: no date and no events. */
	| { date: null; source: "none" };

export function resolveWeddingDate(
	weddingDate: Date | null | undefined,
	events: DatedEvent[]
): WeddingDate {
	if (weddingDate) {
		return { date: weddingDate, source: "set" };
	}
	const earliest = events.reduce<Date | null>(
		(found, event) =>
			found === null || event.startsAt.getTime() < found.getTime() ? event.startsAt : found,
		null
	);
	return earliest ? { date: earliest, source: "derived" } : { date: null, source: "none" };
}

// Calendar days apart, counted by the day each moment falls on rather than by elapsed hours: an
// event at 23:00 the night before the wedding is one day before it, not zero.
export function dayOffset(moment: Date, weddingDate: Date): number {
	const MS_PER_DAY = 24 * 60 * 60 * 1000;
	const startOfDay = (value: Date) =>
		new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
	return Math.round((startOfDay(moment) - startOfDay(weddingDate)) / MS_PER_DAY);
}

/*
 * How an event reads against the wedding day, for the admin's event list. This is the check that
 * catches a mistyped year or a wrong month: an event meant for the night before showing up as
 * "364 days before" is obvious in a way a raw timestamp is not.
 */
export function describeDayOffset(offset: number): string {
	if (offset === 0) {
		return "Wedding day";
	}
	if (offset === -1) {
		return "The day before";
	}
	if (offset === 1) {
		return "The day after";
	}
	return offset < 0 ? `${-offset} days before` : `${offset} days after`;
}
