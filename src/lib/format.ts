import type { Locale } from "@/generated/prisma/enums";
import { locales } from "@/i18n/locales";

export function formatDate(date: Date, locale: Locale, timeZone = "UTC"): string {
	return new Intl.DateTimeFormat(locales[locale].intlTag, { dateStyle: "long", timeZone }).format(
		date
	);
}

export function formatDateTime(date: Date, locale: Locale, timeZone = "UTC"): string {
	return new Intl.DateTimeFormat(locales[locale].intlTag, {
		dateStyle: "long",
		timeZone,
		timeStyle: "short",
	}).format(date);
}

// Weekday plus short date ("Saturday 13 Sept"), the label a timeline node carries above its time.
export function formatDayLabel(date: Date, locale: Locale, timeZone = "UTC"): string {
	return new Intl.DateTimeFormat(locales[locale].intlTag, {
		timeZone,
		weekday: "long",
		day: "numeric",
		month: "short",
	}).format(date);
}

export function formatTime(date: Date, locale: Locale, timeZone = "UTC"): string {
	return new Intl.DateTimeFormat(locales[locale].intlTag, { timeStyle: "short", timeZone }).format(
		date
	);
}
