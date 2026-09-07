import type { Locale } from "@/generated/prisma/enums";
import { getDictionary } from "@/i18n";
import { localeCodes } from "@/i18n/locales";

export type HeadingField = "storyHeading" | "eventsHeading" | "galleryHeading" | "rsvpHeading";

type HeadingRow = { locale: Locale } & Partial<Record<HeadingField, string>>;

// Initial per-locale values for a section's heading field, one row per locale.
export function initialHeadings(rows: HeadingRow[] | undefined, field: HeadingField) {
	return localeCodes.map((code) => ({
		locale: code,
		heading: rows?.find((row) => row.locale === code)?.[field] ?? "",
	}));
}

// The dictionary default shown as each locale's placeholder.
export function headingDefaults(field: HeadingField): Record<Locale, string> {
	return Object.fromEntries(
		localeCodes.map((code) => [code, getDictionary(code).site[field]])
	) as Record<Locale, string>;
}
