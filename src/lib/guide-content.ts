import type { Locale } from "@/generated/prisma/enums";

export type GuideItemView = {
	id: string;
	url: string | null;
	imageUrl: string | null;
	title: string;
	body: string;
};

export type GuideSectionView = {
	id: string;
	slug: string;
	imageUrl: string | null;
	title: string;
	intro: string;
	items: GuideItemView[];
};

// Structural shape of `db.guideSection.findMany({ include: { translations, items: { include:
// { translations } } } })`, so both public pages localize the same way without each re-deriving
// the Prisma payload type.
type GuideSectionRecord = {
	id: string;
	slug: string;
	imageUrl: string | null;
	translations: { locale: Locale; title: string; intro: string }[];
	items: {
		id: string;
		url: string | null;
		imageUrl: string | null;
		translations: { locale: Locale; title: string; body: string }[];
	}[];
};

export const guideSectionsQuery = {
	orderBy: { sortOrder: "asc" },
	include: {
		translations: true,
		items: { orderBy: { sortOrder: "asc" }, include: { translations: true } },
	},
} as const;

// Same fallback rule as events and milestones: the requested locale, else whatever translation
// exists first, so a section typed in one language still renders in the others.
export function localizeGuideSections(
	sections: GuideSectionRecord[],
	locale: Locale
): GuideSectionView[] {
	return sections.map((section) => {
		const translation =
			section.translations.find((candidate) => candidate.locale === locale) ??
			section.translations[0];
		return {
			id: section.id,
			slug: section.slug,
			imageUrl: section.imageUrl,
			title: translation?.title ?? "",
			intro: translation?.intro ?? "",
			items: section.items.map((item) => {
				const itemTranslation =
					item.translations.find((candidate) => candidate.locale === locale) ??
					item.translations[0];
				return {
					id: item.id,
					url: item.url,
					imageUrl: item.imageUrl,
					title: itemTranslation?.title ?? "",
					body: itemTranslation?.body ?? "",
				};
			}),
		};
	});
}
