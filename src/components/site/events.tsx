import Link from "next/link";
import { Card } from "@/components/card";
import { Reveal } from "@/components/site/reveal";
import type { Locale } from "@/generated/prisma/enums";
import type { Dictionary } from "@/i18n";
import { formatDateTime } from "@/lib/format";

export type EventView = {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	startsAt: Date;
	venue: string;
	address: string;
	mapsUrl: string | null;
	dressCode: string | null;
};

export function Events({
	heading,
	events,
	locale,
	dictionary,
}: {
	heading: string;
	events: EventView[];
	locale: Locale;
	dictionary: Dictionary;
}) {
	if (events.length === 0) {
		return null;
	}

	return (
		<section id="events" className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-24">
			<Reveal className="text-center">
				<h2 className="text-4xl font-medium sm:text-5xl">{heading}</h2>
			</Reveal>
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{events.map((event) => (
					<Reveal key={event.id}>
						<Card className="flex h-full flex-col gap-2">
							<h3 className="text-xl">{event.name}</h3>
							<p className="text-sm text-ink/70">{formatDateTime(event.startsAt, locale)}</p>
							{event.description && <p className="text-sm text-ink/70">{event.description}</p>}
							<p className="text-sm">
								{dictionary.rsvp.eventVenueLabel}: {event.venue}
							</p>
							<p className="text-sm">
								{dictionary.rsvp.eventAddressLabel}: {event.address}
							</p>
							{event.dressCode && (
								<p className="text-sm">
									{dictionary.rsvp.eventDressCodeLabel}: {event.dressCode}
								</p>
							)}
							<div className="mt-auto flex gap-4 pt-2 text-sm">
								{event.mapsUrl && (
									<a href={event.mapsUrl} className="text-green underline underline-offset-4">
										{dictionary.rsvp.eventMapsLinkLabel}
									</a>
								)}
								<Link
									href={`/calendar/${event.slug}.ics?locale=${locale}`}
									className="text-green underline underline-offset-4"
								>
									{dictionary.rsvp.eventCalendarLabel}
								</Link>
							</div>
						</Card>
					</Reveal>
				))}
			</div>
		</section>
	);
}
