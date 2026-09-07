import {
	CoffeeIcon,
	HeartIcon,
	type LucideIcon,
	MusicIcon,
	UtensilsIcon,
	WineIcon,
} from "lucide-react";
import Link from "next/link";
import type { EventView } from "@/components/site/events";
import { LemonGlyph } from "@/components/site/lemon-sprig";
import { Reveal } from "@/components/site/reveal";
import type { Locale } from "@/generated/prisma/enums";
import type { Dictionary } from "@/i18n";
import { formatDayLabel, formatTime } from "@/lib/format";

/*
 * The MEDITERRANEAN events layout: every event is a node on one rule — alternating left and right
 * of a centre rule from `lg:` up, a single column beside a left rule below it. Each node leads
 * with a glyph, the weekday and date, the time set large, the name and the description, and
 * keeps the venue, address, dress code and links behind a native `<details>` disclosure so the
 * sequence stays readable at a glance while nothing the old cards carried is lost. `<details>`
 * rather than client state: it works without JavaScript and is keyboard-accessible for free.
 *
 * The glyph is picked from a few keywords in the slug/name (the couple edits both, in any of the
 * three languages) and falls back to the theme's lemon when nothing matches.
 */
const glyphKeywords: [RegExp, LucideIcon][] = [
	[/ceremon|wedding|trauung|church|vow|dawet|hochzeit/, HeartIcon],
	[/brunch|breakfast|lunch|coffee|frühstück|taştê/, CoffeeIcon],
	[/dinner|reception|supper|essen|empfang|şîv/, UtensilsIcon],
	[/drink|welcome|aperitiv|cocktail|toast|begrüßung/, WineIcon],
	[/party|dance|feier|tanz|dîlan|govend/, MusicIcon],
];

function glyphFor(event: EventView): LucideIcon | null {
	const haystack = `${event.slug} ${event.name}`.toLowerCase();
	return glyphKeywords.find(([pattern]) => pattern.test(haystack))?.[1] ?? null;
}

// Shared across every theme's list: incremental stagger delay, capped so a long programme
// doesn't push the last nodes' reveal far past the first.
function staggerDelay(index: number): number {
	return Math.min(index * 80, 400);
}

export function EventsTimeline({
	events,
	locale,
	dictionary,
}: {
	events: EventView[];
	locale: Locale;
	dictionary: Dictionary;
}) {
	return (
		<div className="relative mx-auto flex w-full max-w-5xl flex-col gap-12 lg:gap-16">
			{/* The rule: down the node column on the left below `lg`, down the centre from `lg` up. */}
			<div
				aria-hidden="true"
				className="absolute top-2 bottom-2 left-5 w-px bg-green/30 lg:left-1/2 lg:-translate-x-1/2"
			/>
			{events.map((event, index) => {
				const Glyph = glyphFor(event);
				// Even nodes sit left of the centre rule and read right-aligned towards it.
				const isLeft = index % 2 === 0;
				const sideClassName = isLeft
					? "lg:col-start-1 lg:items-end lg:text-right"
					: "lg:col-start-3 lg:items-start lg:text-left";
				return (
					<Reveal
						key={event.id}
						delay={staggerDelay(index)}
						className="relative flex gap-5 lg:grid lg:grid-cols-[1fr_3rem_1fr] lg:gap-x-10"
					>
						<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ivory text-green ring-1 ring-green/40 lg:col-start-2 lg:row-start-1 lg:h-12 lg:w-12 lg:justify-self-center">
							{Glyph ? (
								<Glyph aria-hidden="true" className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={1.5} />
							) : (
								<LemonGlyph className="h-5 w-6" />
							)}
						</span>
						<div className={`flex flex-col gap-1 pt-2 lg:row-start-1 lg:pt-3 ${sideClassName}`}>
							<span className="text-[0.65rem] uppercase tracking-[0.25em] text-green">
								{formatDayLabel(event.startsAt, locale)}
							</span>
							<span className="font-display text-3xl leading-none text-ink">
								{formatTime(event.startsAt, locale)}
							</span>
							<h3 className="mt-1 text-xl">{event.name}</h3>
							{event.description && (
								<p className="max-w-md text-sm text-ink/70 italic">{event.description}</p>
							)}
							<details className="group mt-2 flex flex-col text-sm">
								{/* `list-none` plus the WebKit pseudo-element hides the default marker; the
								    two labels swap on the element's own `open` state via `group-open:`. */}
								<summary className="link-underline w-fit cursor-pointer list-none text-green [&::-webkit-details-marker]:hidden">
									<span className="group-open:hidden">{dictionary.rsvp.eventDetailsShowLabel}</span>
									<span className="hidden group-open:inline">
										{dictionary.rsvp.eventDetailsHideLabel}
									</span>
								</summary>
								<div className={`mt-3 flex flex-col gap-1 ${sideClassName}`}>
									<p>
										{dictionary.rsvp.eventVenueLabel}: {event.venue}
									</p>
									<p>
										{dictionary.rsvp.eventAddressLabel}: {event.address}
									</p>
									{event.dressCode && (
										<p>
											{dictionary.rsvp.eventDressCodeLabel}: {event.dressCode}
										</p>
									)}
									<div className="flex gap-4 pt-2">
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
								</div>
							</details>
						</div>
					</Reveal>
				);
			})}
		</div>
	);
}
