import { isRichTextEmpty } from "@/domain/rich-text";
import type { Locale } from "@/generated/prisma/enums";

// Each field falls back independently: requested language, English, German, then Kurmanji.
// Empty editor HTML is missing copy too; a partially translated record keeps its translated fields.
export function populatedTranslation<K extends string>(
	translations: readonly ({ locale: Locale } & Record<K, string | null>)[],
	locale: Locale,
	fields: readonly K[]
): Record<K, string> {
	const order = [...new Set<Locale>([locale, "en", "de", "ku"])];
	return Object.fromEntries(
		fields.map((field) => {
			for (const language of order) {
				const value = translations.find((row) => row.locale === language)?.[field];
				if (value && !isRichTextEmpty(value)) return [field, value];
			}
			return [field, ""];
		})
	) as Record<K, string>;
}
