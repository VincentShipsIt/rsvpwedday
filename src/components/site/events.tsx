import Link from "next/link";
import { Card } from "@/components/card";
import { Reveal } from "@/components/site/reveal";
import { type Locale, SiteTheme } from "@/generated/prisma/enums";
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

type EventListProps = {
	events: EventView[];
	locale: Locale;
	dictionary: Dictionary;
};

export function Events({
	heading,
	events,
	locale,
	dictionary,
	theme,
}: {
	heading: string;
	events: EventView[];
	locale: Locale;
	dictionary: Dictionary;
	theme: SiteTheme;
}) {
	if (events.length === 0) {
		return null;
	}

	return (
		<section
			id="events"
			className="mx-auto flex max-w-6xl scroll-mt-[var(--wed-nav-height)] flex-col gap-12 px-6 py-24"
		>
			<Reveal className="text-center">
				<h2 className="text-4xl font-medium sm:text-5xl">{heading}</h2>
			</Reveal>
			{theme === SiteTheme.MODERN && (
				<ModernEventList events={events} locale={locale} dictionary={dictionary} />
			)}
			{theme === SiteTheme.GARDEN && (
				<GardenEventCards events={events} locale={locale} dictionary={dictionary} />
			)}
			{theme === SiteTheme.EDITORIAL && (
				<EditorialEventCards events={events} locale={locale} dictionary={dictionary} />
			)}
		</section>
	);
}

function EventDetails({ event, locale, dictionary }: { event: EventView } & EventListProps) {
	return (
		<>
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
		</>
	);
}

function EditorialEventCards({ events, locale, dictionary }: EventListProps) {
	return (
		<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{events.map((event) => (
				<Reveal key={event.id}>
					<Card className="flex h-full flex-col gap-2">
						<EventDetails event={event} locale={locale} dictionary={dictionary} />
					</Card>
				</Reveal>
			))}
		</div>
	);
}

function ModernEventList({ events, locale, dictionary }: EventListProps) {
	return (
		<div className="flex flex-col divide-y divide-ink/15 border-y border-ink/15">
			{events.map((event) => (
				<Reveal key={event.id}>
					<div className="flex flex-col gap-2 py-6">
						<EventDetails event={event} locale={locale} dictionary={dictionary} />
					</div>
				</Reveal>
			))}
		</div>
	);
}

function GardenEventCards({ events, locale, dictionary }: EventListProps) {
	return (
		<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{events.map((event) => (
				<Reveal key={event.id}>
					<div className="flex h-full flex-col gap-2 rounded-2xl border-t-4 border-[var(--wed-secondary)] bg-white/70 p-6 shadow-sm">
						<EventDetails event={event} locale={locale} dictionary={dictionary} />
					</div>
				</Reveal>
			))}
		</div>
	);
}
