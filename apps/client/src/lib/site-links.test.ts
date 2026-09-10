import { describe, expect, it } from "vitest";
import { BlockType } from "@/generated/prisma/enums";
import { en } from "@/i18n/dictionaries/en";
import type { BlockView, PageView, SiteData } from "@/lib/page-content";
import { buildSiteLinks } from "@/lib/site-links";

const site: SiteData = {
	eventCount: 3,
	milestoneCount: 2,
	giftCount: 4,
	hasSettings: true,
};

function block(type: BlockType, partial: Partial<BlockView> = {}): BlockView {
	return {
		id: `${type}-${partial.anchor ?? partial.url ?? ""}`,
		type,
		anchor: "",
		imageUrl: null,
		imageUrls: type === BlockType.GALLERY ? ["https://example.com/a.jpg"] : [],
		url: null,
		title: "",
		body: "",
		items: [],
		...partial,
	};
}

function page(slug: string, blocks: BlockView[], partial: Partial<PageView> = {}): PageView {
	return { id: slug, slug, showInNav: true, title: "", intro: "", blocks, ...partial };
}

/*
 * The bar the couple asked for: their own sections, with a separate page sitting between two of
 * them because that is where its teaser block sits on the home page.
 */
const home = page("home", [
	block(BlockType.HERO),
	block(BlockType.STORY, { anchor: "story", title: "Our story" }),
	block(BlockType.EVENTS, { anchor: "events", title: "Wedding weekend" }),
	block(BlockType.PAGE_LINK, { url: "/guide", title: "Discover Malta" }),
	block(BlockType.GALLERY, { anchor: "gallery", title: "Gallery" }),
	block(BlockType.FAQ, {
		anchor: "faq",
		title: "FAQs",
		items: [{ id: "q", url: null, imageUrl: null, title: "When?", body: "Then." }],
	}),
	block(BlockType.RSVP, { anchor: "rsvp", title: "RSVP" }),
]);
const guide = page("guide", [block(BlockType.CARDS, { anchor: "where-to-stay", title: "Hotels" })]);

describe("buildSiteLinks", () => {
	it("puts a teased page in the bar where its teaser sits, between two sections", () => {
		const { navLinks } = buildSiteLinks({ pages: [home, guide], site, dictionary: en });
		expect(navLinks).toEqual([
			{ href: "/#story", label: "Our story" },
			{ href: "/#events", label: "Wedding weekend" },
			{ href: "/guide", label: "Discover Malta" },
			{ href: "/#gallery", label: "Gallery" },
			{ href: "/#faq", label: "FAQs" },
			{ href: "/#rsvp", label: "RSVP" },
		]);
	});

	it("keeps every section link an absolute in-page anchor, so it works from another page", () => {
		const { navLinks } = buildSiteLinks({ pages: [home, guide], site, dictionary: en });
		const anchors = navLinks.filter((link) => link.href.includes("#"));
		expect(anchors.every((link) => link.href.startsWith("/#"))).toBe(true);
	});

	it("names a teaser with no title of its own after the page it points at", () => {
		const untitled = page("home", [block(BlockType.PAGE_LINK, { url: "/guide" })]);
		const named = page("guide", [block(BlockType.CARDS, { anchor: "a", title: "Hotels" })], {
			title: "Discover Malta",
		});
		const { navLinks } = buildSiteLinks({ pages: [untitled, named], site, dictionary: en });
		expect(navLinks).toEqual([{ href: "/guide", label: "Discover Malta" }]);
	});

	it("does not list a teased page twice in the footer", () => {
		const { footerLinks } = buildSiteLinks({ pages: [home, guide], site, dictionary: en });
		expect(footerLinks.filter((link) => link.href === "/guide")).toHaveLength(1);
	});

	it("still puts an unteased page in the footer, and keeps it out of the bar", () => {
		const extra = page("legal", [block(BlockType.TEXT, { anchor: "", title: "Impressum" })]);
		const { navLinks, footerLinks } = buildSiteLinks({
			pages: [home, guide, extra],
			site,
			dictionary: en,
		});
		expect(navLinks.map((link) => link.href)).not.toContain("/legal");
		expect(footerLinks.map((link) => link.href)).toContain("/legal");
	});

	it("drops a teaser pointing nowhere rather than emitting a dead link", () => {
		const broken = page("home", [block(BlockType.PAGE_LINK, { url: null, title: "Somewhere" })]);
		expect(buildSiteLinks({ pages: [broken], site, dictionary: en }).navLinks).toEqual([]);
	});

	it("gives an empty section no link at all, so the bar cannot scroll to nothing", () => {
		const empty = page("home", [
			block(BlockType.STORY, { anchor: "story", title: "Our story" }),
			block(BlockType.GALLERY, { anchor: "gallery", title: "Gallery", imageUrls: [] }),
		]);
		const { navLinks } = buildSiteLinks({
			pages: [empty],
			site: { ...site, milestoneCount: 1 },
			dictionary: en,
		});
		expect(navLinks.map((link) => link.href)).toEqual(["/#story"]);
	});
});
