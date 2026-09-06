import { Locale } from "@/generated/prisma/enums";

export type LocaleDefinition = {
	code: Locale;
	label: string;
	dir: "ltr" | "rtl";
	intlTag: string;
};

export const locales: Record<Locale, LocaleDefinition> = {
	[Locale.en]: { code: Locale.en, label: "English", dir: "ltr", intlTag: "en-GB" },
	[Locale.de]: { code: Locale.de, label: "Deutsch", dir: "ltr", intlTag: "de-CH" },
	[Locale.ku]: { code: Locale.ku, label: "Kurmancî", dir: "ltr", intlTag: "ku" },
};

export const localeCodes = Object.values(Locale);

export function isLocale(value: string): value is Locale {
	return value in Locale;
}
