import { HOME_PAGE_SLUG } from "@/domain/blocks";
import { BlockType, type Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export type HomeHero = { imageUrl: string | null; tagline: string };

// The home page's hero photo and tagline, for the three places outside the page renderer that
// need them: the site metadata, the OG card, and the photo at the top of every email. They live
// on the home page's hero block now, not on `SiteContent`.
export async function getHomeHero(locale: Locale): Promise<HomeHero> {
	const block = await db.block.findFirst({
		where: { type: BlockType.HERO, page: { slug: HOME_PAGE_SLUG } },
		orderBy: { sortOrder: "asc" },
		include: { translations: true },
	});
	if (!block) {
		return { imageUrl: null, tagline: "" };
	}
	const translation =
		block.translations.find((candidate) => candidate.locale === locale) ?? block.translations[0];
	return { imageUrl: block.imageUrl, tagline: translation?.title ?? "" };
}
