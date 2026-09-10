import { cookies } from "next/headers";
import { Locale } from "@/generated/prisma/enums";
import { isLocale } from "@/i18n/locales";

export const SITE_LOCALE_COOKIE = "site_locale";

// `src/proxy.ts` writes the cookie when `?lang=` is present, so this only has to read it back.
export async function resolveSiteLocale(lang: string | undefined): Promise<Locale> {
	if (lang && isLocale(lang)) {
		return lang;
	}

	const cookieStore = await cookies();
	const cookieValue = cookieStore.get(SITE_LOCALE_COOKIE)?.value;
	if (cookieValue && isLocale(cookieValue)) {
		return cookieValue;
	}

	return Locale.en;
}
