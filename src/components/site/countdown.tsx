"use client";

import { useEffect, useState } from "react";

export type CountdownLabels = {
	days: string;
	hours: string;
	minutes: string;
	seconds: string;
	today: string;
};

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function computeRemaining(targetMs: number): Remaining | "today" {
	const diffMs = targetMs - Date.now();
	if (diffMs <= 0) {
		return "today";
	}

	const totalSeconds = Math.floor(diffMs / 1000);
	return {
		days: Math.floor(totalSeconds / 86400),
		hours: Math.floor((totalSeconds % 86400) / 3600),
		minutes: Math.floor((totalSeconds % 3600) / 60),
		seconds: totalSeconds % 60,
	};
}

export function Countdown({
	targetDate,
	labels,
	variant = "plain",
}: {
	targetDate: string;
	labels: CountdownLabels;
	variant?: "plain" | "pills";
}) {
	const targetMs = new Date(targetDate).getTime();
	// Starts null so the server-rendered markup and the first client render match; the effect
	// fills in the real value once mounted, which also keeps the ticking clock off the server render.
	const [remaining, setRemaining] = useState<Remaining | "today" | null>(null);

	useEffect(() => {
		setRemaining(computeRemaining(targetMs));
		const interval = setInterval(() => setRemaining(computeRemaining(targetMs)), 1000);
		return () => clearInterval(interval);
	}, [targetMs]);

	if (remaining === null) {
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
			? "flex flex-col items-center rounded-full bg-ivory-dark px-4 py-3"
			: "flex flex-col";

	return (
		<div className="flex gap-4 text-center sm:gap-8" aria-live="polite">
			{units.map(([value, label]) => (
				<div key={label} className={unitClassName}>
					<span className="font-display text-3xl sm:text-4xl">
						{String(value).padStart(2, "0")}
					</span>
					{/* `opacity-70` (not a hardcoded color) so this reads correctly against every
					    theme's ambient text color, light or dark. */}
					<span className="text-xs uppercase tracking-wide opacity-70">{label}</span>
				</div>
			))}
		</div>
	);
}
