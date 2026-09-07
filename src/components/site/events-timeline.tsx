import {
	CoffeeIcon,
	HeartIcon,
	type LucideIcon,
	MusicIcon,
	UtensilsIcon,
	WineIcon,
} from "lucide-react";
import type { EventView } from "@/components/site/events";
import { LemonGlyph } from "@/components/site/lemon-sprig";
import { Reveal } from "@/components/site/reveal";
import type { Locale } from "@/generated/prisma/enums";
import { formatDayLabel, formatTime } from "@/lib/format";

/*
 * The weekend-at-a-glance strip above the MEDITERRANEAN event cards: one node per event on a
 * single rule — a row from `lg:` up, a left-hand column below it — each with a glyph, the weekday
 * and date, the time set large, the name, and the description. The glyph is picked from a few
 * keywords in the slug/name (the couple edits both, in any of the three languages) and falls back
 * to the theme's lemon when nothing matches, so an unrecognised event still gets a node.
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

export function EventsTimeline({ events, locale }: { events: EventView[]; locale: Locale }) {
	return (
		<Reveal>
			<ol className="relative flex flex-col gap-10 lg:flex-row lg:gap-0">
				{/* The connecting rule: vertical through the node column below `lg`, horizontal
				    through the row of nodes from `lg` up (the nodes paint over it in cream). */}
				<div
					aria-hidden="true"
					className="absolute top-2 bottom-2 left-5 w-px bg-green/30 lg:top-6 lg:right-[12.5%] lg:bottom-auto lg:left-[12.5%] lg:h-px lg:w-auto"
				/>
				{events.map((event) => {
					const Glyph = glyphFor(event);
					return (
						<li
							key={event.id}
							className="relative flex gap-5 lg:flex-1 lg:flex-col lg:items-center lg:px-3 lg:text-center"
						>
							<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ivory text-green ring-1 ring-green/40 lg:h-12 lg:w-12">
								{Glyph ? (
									<Glyph aria-hidden="true" className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={1.5} />
								) : (
									<LemonGlyph className="h-5 w-6" />
								)}
							</span>
							<div className="flex flex-col gap-1 pt-2 lg:items-center lg:pt-4">
								<span className="text-[0.65rem] uppercase tracking-[0.25em] text-green">
									{formatDayLabel(event.startsAt, locale)}
								</span>
								<span className="font-display text-2xl leading-none text-ink">
									{formatTime(event.startsAt, locale)}
								</span>
								<span className="font-display mt-1 text-lg">{event.name}</span>
								{event.description && (
									<p className="max-w-xs text-sm text-ink/70 italic">{event.description}</p>
								)}
							</div>
						</li>
					);
				})}
			</ol>
		</Reveal>
	);
}
