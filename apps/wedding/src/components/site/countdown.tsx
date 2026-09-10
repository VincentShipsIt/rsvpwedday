"use client";

import { useEffect, useState } from "react";
import { computeCountdown, type Remaining } from "@/domain/countdown";

export type CountdownLabels = {
	days: string;
	hours: string;
	minutes: string;
	seconds: string;
	today: string;
};

export function Countdown({
	targetDate,
	timeZone = "UTC",
	labels,
	variant = "plain",
}: {
	targetDate: string;
	timeZone?: string;
	labels: CountdownLabels;
	variant?: "plain" | "pills";
}) {
	const targetMs = new Date(targetDate).getTime();
	// Starts null so the server-rendered markup and the first client render match; the effect
	// fills in the real value once mounted, which also keeps the ticking clock off the server render.
	const [remaining, setRemaining] = useState<Remaining | "today" | "past" | null>(null);

	useEffect(() => {
		setRemaining(computeCountdown(targetMs, Date.now(), timeZone));
		const interval = setInterval(
			() => setRemaining(computeCountdown(targetMs, Date.now(), timeZone)),
			1000
		);
		return () => clearInterval(interval);
	}, [targetMs, timeZone]);

	if (remaining === null || remaining === "past") {
		return null;
	}

	if (remaining === "today") {
		return <p className="font-display text-2xl">{labels.today}</p>;
	}

	const units: [number, string][] = [
		[remaining.days, labels.days],
		[remaining.hours, labels.hours],
		[remaining.minutes, labels.minutes],
		[remaining.seconds, labels.seconds],
	];

	const unitClassName =
		variant === "pills"
			? "flex flex-col items-center rounded-full bg-ivory-dark px-1.5 py-1.5 sm:px-4 sm:py-3"
			: "flex flex-col items-center";

	return (
		// A fixed four-column grid (not `flex-wrap`) keeps all four units on one row down to the
		// narrowest supported viewport (360px) instead of wrapping the fourth to its own line; the
		// type, padding, and gap all shrink at the base size and grow back from `sm:` up, so the
		// worst case (three-digit days plus an eight-letter label like "SEKUNDEN"/"ÇIRKE") still
		// fits inside each column.
		<div className="grid grid-cols-4 gap-1.5 text-center sm:gap-8">
			{units.map(([value, label]) => (
				<div key={label} className={unitClassName}>
					{/* `overflow-hidden` frames the digit slot; keying the inner span by `value`
					    remounts it on every change, which is what plays the `countdown-digit-in`
					    slide-up (globals.css) instead of the text just snapping to the new digit.
					    `leading-none` on both spans pins the slot's height to exactly one em
					    (matching `h-[1em]`) instead of the font's default half-leading, which the
					    seconds unit — remounting every second — would otherwise drift against and
					    render partway clipped by `overflow-hidden` mid-animation. */}
					<span className="block h-[1em] overflow-hidden font-display text-2xl leading-none sm:text-4xl">
						<span key={value} className="countdown-digit leading-none">
							{String(value).padStart(2, "0")}
						</span>
					</span>
					{/* `opacity-70` (not a hardcoded color) so this reads correctly against every
					    theme's ambient text color, light or dark. Tracking tightens alongside the
					    smaller base size — full `tracking-wide` at that size is what pushed the
					    longest labels (German "SEKUNDEN", Kurmanji "ÇIRKE") past the column width. */}
					<span className="text-[0.6rem] tracking-tight break-words opacity-70 uppercase sm:text-xs sm:tracking-wide">
						{label}
					</span>
				</div>
			))}
		</div>
	);
}
