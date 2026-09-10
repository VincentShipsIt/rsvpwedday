export type Remaining = { days: number; hours: number; minutes: number; seconds: number };

export function computeCountdown(
	targetMs: number,
	nowMs: number,
	timeZone: string
): Remaining | "today" | "past" {
	if (!Number.isFinite(targetMs)) return "past";
	const date = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	const diff = targetMs - nowMs;
	if (diff <= 0) return date.format(targetMs) === date.format(nowMs) ? "today" : "past";
	const seconds = Math.floor(diff / 1000);
	return {
		days: Math.floor(seconds / 86400),
		hours: Math.floor((seconds % 86400) / 3600),
		minutes: Math.floor((seconds % 3600) / 60),
		seconds: seconds % 60,
	};
}
