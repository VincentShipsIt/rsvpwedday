import { Locale } from "@/generated/prisma/client";
import { de } from "@/i18n/dictionaries/de";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { en } from "@/i18n/dictionaries/en";
import { ku } from "@/i18n/dictionaries/ku";

const dictionaries: Record<Locale, Dictionary> = {
	[Locale.en]: en,
	[Locale.de]: de,
	[Locale.ku]: ku,
};

export function getDictionary(locale: Locale): Dictionary {
	return dictionaries[locale];
}

export function t(template: string, vars: Record<string, string | number> = {}): string {
	return template.replace(/\{(\w+)\}/g, (match, key: string) => {
		const value = vars[key];
		return value === undefined ? match : String(value);
	});
}

export type { Dictionary };
