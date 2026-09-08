import { BLOCK_DEFINITIONS, pagePath } from "@/domain/blocks";
import { isRichTextEmpty } from "@/domain/rich-text";
import { notDeleted } from "@/domain/soft-delete";
import { populatedTranslation } from "@/domain/translations";
import { BlockType, type Locale } from "@/generated/prisma/enums";
import type { Dictionary } from "@/i18n";
import type { SiteLink } from "@/lib/site-links";

export type BlockItemView = {
	id: string;
	url: string | null;
	imageUrl: string | null;
	title: string;
	body: string;
};

export type BlockView = {
	id: string;
	type: BlockType;
	anchor: string;
	imageUrl: string | null;
	imageUrls: string[];
	url: string | null;
	title: string;
	body: string;
	items: BlockItemView[];
};

export type PageView = {
	id: string;
	slug: string;
	showInNav: boolean;
	title: string;
	intro: string;
	blocks: BlockView[];
};

// Structural shape of `db.page.findUnique({ include: pageInclude })`, so the public pages and
// the admin localize the same way without re-deriving the Prisma payload type.
type PageRecord = {
	id: string;
	slug: string;
	showInNav: boolean;
	translations: { locale: Locale; title: string; intro: string }[];
	blocks: {
		id: string;
		type: BlockType;
		anchor: string;
		imageUrl: string | null;
		imageUrls: string[];
		url: string | null;
		translations: { locale: Locale; title: string; body: string }[];
		items: {
			id: string;
			url: string | null;
			imageUrl: string | null;
			translations: { locale: Locale; title: string; body: string }[];
		}[];
	}[];
};

export const pageInclude = {
	translations: true,
	blocks: {
		where: notDeleted,
		orderBy: { sortOrder: "asc" },
		include: {
			translations: true,
			items: { where: notDeleted, orderBy: { sortOrder: "asc" }, include: { translations: true } },
		},
	},
} as const;

export function localizePage(page: PageRecord, locale: Locale): PageView {
	const translation = populatedTranslation(page.translations, locale, ["title", "intro"]);
	return {
		id: page.id,
		slug: page.slug,
		showInNav: page.showInNav,
		title: translation?.title ?? "",
		intro: translation?.intro ?? "",
		blocks: page.blocks.map((block) => {
			const blockTranslation = populatedTranslation(block.translations, locale, ["title", "body"]);
			return {
				id: block.id,
				type: block.type,
				anchor: block.anchor,
				imageUrl: block.imageUrl,
				imageUrls: block.imageUrls,
				url: block.url,
				title: blockTranslation?.title ?? "",
				body: blockTranslation?.body ?? "",
				items: block.items.map((item) => {
					const itemTranslation = populatedTranslation(item.translations, locale, [
						"title",
						"body",
					]);
					return {
						id: item.id,
						url: item.url,
						imageUrl: item.imageUrl,
						title: itemTranslation?.title ?? "",
						body: itemTranslation?.body ?? "",
					};
				}),
			};
		}),
	};
}

// What the built-in blocks need from outside the page to know whether they have anything to show.
export type SiteData = {
	eventCount: number;
	milestoneCount: number;
	giftCount: number;
	hasSettings: boolean;
};

// A block with nothing in it renders nothing and gets no nav link, so an unfilled block never
// leaves a heading over an empty section or a dead anchor.
export function cardHasContent(item: BlockItemView): boolean {
	return (
		!isRichTextEmpty(item.title) ||
		!isRichTextEmpty(item.body) ||
		Boolean(item.imageUrl || item.url)
	);
}

export function blockHasContent(block: BlockView, site: SiteData): boolean {
	switch (block.type) {
		case BlockType.HERO:
			return true;
		case BlockType.STORY:
			return site.milestoneCount > 0 || !isRichTextEmpty(block.body);
		case BlockType.EVENTS:
			return site.eventCount > 0;
		case BlockType.GALLERY:
			return block.imageUrls.length > 0;
		case BlockType.FAQ:
			return block.items.some((item) => item.title.trim() !== "");
		case BlockType.RSVP:
			return site.hasSettings;
		case BlockType.GIFTS:
			return site.giftCount > 0;
		case BlockType.TEXT:
			return block.title.trim() !== "" || !isRichTextEmpty(block.body);
		case BlockType.CARDS:
			return (
				block.title.trim() !== "" ||
				!isRichTextEmpty(block.body) ||
				Boolean(block.imageUrl) ||
				block.items.some(cardHasContent)
			);
		case BlockType.IMAGE:
			return Boolean(block.imageUrl);
		case BlockType.PAGE_LINK:
			return Boolean(block.url);
	}
}

export function visibleBlocks(page: PageView, site: SiteData): BlockView[] {
	return page.blocks.filter((block) => blockHasContent(block, site));
}

// A block's heading: its own title, else the dictionary default its type carries (built-in
// sections), else nothing.
export function blockHeading(block: BlockView, dictionary: Dictionary): string {
	if (block.title.trim() !== "") {
		return block.title;
	}
	const key = BLOCK_DEFINITIONS[block.type].defaultHeadingKey;
	return key ? dictionary.site[key] : "";
}

// Nav label for a page: its title, else the dictionary's guide label for the guide, else the
// slug itself in Title Case, so a page is always reachable even before it is named.
export function pageLabel(page: { slug: string; title: string }, dictionary: Dictionary): string {
	if (page.title.trim() !== "") {
		return page.title;
	}
	if (page.slug === "guide") {
		return dictionary.site.navGuide;
	}
	return page.slug
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

/*
 * A page's own links, in block order: an anchor for every visible block that carries one, and a
 * link to the target page for every page teaser.
 *
 * Including teasers is what lets a separate page sit in the top bar between two sections — "Our
 * story · Wedding weekend · Discover Malta · Gallery" — and the block's position decides where.
 * The couple orders the bar by dragging blocks on the home page, which is the same gesture that
 * orders the page itself, rather than through a second list that could disagree with it.
 */
export function pageAnchorLinks(
	page: PageView,
	site: SiteData,
	dictionary: Dictionary,
	/** Every page, so a teaser with no title of its own can borrow the target page's label. */
	pages: PageView[] = []
): SiteLink[] {
	return visibleBlocks(page, site).flatMap((block) => {
		if (block.type === BlockType.PAGE_LINK) {
			if (!block.url) {
				return [];
			}
			const target = pages.find((candidate) => pagePath(candidate.slug) === block.url);
			const label =
				block.title.trim() ||
				(target ? pageLabel(target, dictionary) : block.url.replace(/^\//, ""));
			return [{ href: block.url, label }];
		}
		return block.anchor === ""
			? []
			: [
					{
						href: `${pagePath(page.slug)}#${block.anchor}`,
						label: blockHeading(block, dictionary) || block.anchor,
					},
				];
	});
}
