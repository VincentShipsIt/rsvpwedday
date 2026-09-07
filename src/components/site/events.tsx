import Link from "next/link";
import { Card } from "@/components/card";
import { Reveal } from "@/components/site/reveal";
import { RichText } from "@/components/site/rich-text";
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
			{theme === SiteTheme.MIDNIGHT && (
				<MidnightEventCards events={events} locale={locale} dictionary={dictionary} />
			)}
			{theme === SiteTheme.BOHO && (
				<BohoEventCards events={events} locale={locale} dictionary={dictionary} />
			)}
			{theme === SiteTheme.VINTAGE && (
				<VintageEventCards events={events} locale={locale} dictionary={dictionary} />
			)}
		</section>
	);
}

function EventDetails({
	event,
	locale,
	dictionary,
}: { event: EventView } & Omit<EventListProps, "events">) {
	return (
		<>
			<h3 className="text-xl">{event.name}</h3>
			<p className="text-sm text-ink/70">{formatDateTime(event.startsAt, locale)}</p>
			{event.description && <RichText html={event.description} className="text-sm text-ink/70" />}
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
					<a href={event.mapsUrl} className="link-underline text-green">
						{dictionary.rsvp.eventMapsLinkLabel}
					</a>
				)}
				<Link
					href={`/calendar/${event.slug}.ics?locale=${locale}`}
					className="link-underline text-green"
				>
					{dictionary.rsvp.eventCalendarLabel}
				</Link>
			</div>
		</>
	);
}

// Shared across every theme's card grid: incremental stagger delay, capped so a long guest list
// doesn't push the last cards' reveal far past the first.
function staggerDelay(index: number): number {
	return Math.min(index * 80, 400);
}

function EditorialEventCards({ events, locale, dictionary }: EventListProps) {
	return (
		<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{events.map((event, index) => (
				<Reveal key={event.id} delay={staggerDelay(index)}>
					<Card className="hover-lift flex h-full flex-col gap-2">
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
			{events.map((event, index) => (
				<Reveal key={event.id} delay={staggerDelay(index)}>
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
			{events.map((event, index) => (
				<Reveal key={event.id} delay={staggerDelay(index)}>
					<div className="hover-lift flex h-full flex-col gap-2 rounded-2xl border-t-4 border-[var(--wed-secondary)] bg-white/70 p-6 shadow-sm">
						<EventDetails event={event} locale={locale} dictionary={dictionary} />
					</div>
				</Reveal>
			))}
		</div>
	);
}

function MidnightEventCards({ events, locale, dictionary }: EventListProps) {
	return (
		<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{events.map((event, index) => (
				<Reveal key={event.id} delay={staggerDelay(index)}>
					<div className="hover-lift flex h-full flex-col gap-2 rounded-lg border border-green/40 bg-transparent p-6">
						<EventDetails event={event} locale={locale} dictionary={dictionary} />
					</div>
				</Reveal>
			))}
		</div>
	);
}

function BohoEventCards({ events, locale, dictionary }: EventListProps) {
	return (
		<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{events.map((event, index) => (
				<Reveal key={event.id} delay={staggerDelay(index)}>
					<div className="hover-lift flex h-full flex-col gap-2 rounded-3xl border-t-4 border-green bg-green-dark p-6 text-ivory [&_a]:text-ivory [&_h3]:text-ivory [&_p]:text-ivory/80">
						<EventDetails event={event} locale={locale} dictionary={dictionary} />
					</div>
				</Reveal>
			))}
		</div>
	);
}

function VintageEventCards({ events, locale, dictionary }: EventListProps) {
	return (
		<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{events.map((event, index) => (
				<Reveal key={event.id} delay={staggerDelay(index)}>
					<div className="hover-lift relative flex h-full flex-col gap-2 border-t-2 border-green bg-ivory p-6 shadow-sm">
						{/* A small wax-seal-style badge, pure CSS/Tailwind, no image asset. */}
						<span className="absolute -top-3 right-6 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-ink shadow-sm">
							{String(index + 1).padStart(2, "0")}
						</span>
						<EventDetails event={event} locale={locale} dictionary={dictionary} />
					</div>
				</Reveal>
			))}
		</div>
	);
}
