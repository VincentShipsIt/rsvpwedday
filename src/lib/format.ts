import type { Locale } from "@/generated/prisma/enums";
import { locales } from "@/i18n/locales";

export function formatDate(date: Date, locale: Locale): string {
	return new Intl.DateTimeFormat(locales[locale].intlTag, { dateStyle: "long" }).format(date);
}

export function formatDateTime(date: Date, locale: Locale): string {
	return new Intl.DateTimeFormat(locales[locale].intlTag, {
		dateStyle: "long",
		timeStyle: "short",
	}).format(date);
}

export function formatTime(date: Date, locale: Locale): string {
	return new Intl.DateTimeFormat(locales[locale].intlTag, { timeStyle: "short" }).format(date);
}
