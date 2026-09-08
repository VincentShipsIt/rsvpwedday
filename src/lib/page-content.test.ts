import { describe, expect, it } from "vitest";
import { BlockType } from "@/generated/prisma/enums";
import { en } from "@/i18n/dictionaries/en";
import {
	type BlockView,
	blockHasContent,
	cardHasContent,
	localizePage,
	type PageView,
	type SiteData,
	visibleBlocks,
} from "@/lib/page-content";
import { buildSiteLinks } from "@/lib/site-links";

const site: SiteData = { eventCount: 0, milestoneCount: 0, giftCount: 0, hasSettings: false };
const empty: BlockView = {
	id: "cards",
	type: BlockType.CARDS,
	anchor: "travel",
	imageUrl: null,
	imageUrls: [],
	url: null,
	title: "",
	body: "",
	items: [],
};
const item = { id: "item", imageUrl: null, url: null, title: "", body: "" };

describe("renderer-aligned card visibility", () => {
	it.each([
		{ imageUrl: "https://example.com/photo.jpg" },
		{ body: "<p>Directions</p>" },
		{ url: "https://example.com" },
	])("shows independently populated cards %j", (copy) => {
		const card = { ...item, ...copy };
		const block = { ...empty, items: [card] };
		const page: PageView = {
			id: "travel",
			slug: "travel",
			showInNav: true,
			title: "Travel",
			intro: "",
			blocks: [block],
		};
		expect(cardHasContent(card)).toBe(true);
		expect(visibleBlocks(page, site)).toHaveLength(1);
		expect(buildSiteLinks({ pages: [page], site, dictionary: en }).footerLinks).toContainEqual({
			href: "/travel",
			label: "Travel",
		});
	});
	it("shows a block photo and omits truly empty item shells", () => {
		expect(blockHasContent({ ...empty, imageUrl: "https://example.com/photo.jpg" }, site)).toBe(
			true
		);
		expect(cardHasContent({ ...item, body: "<p><br></p>" })).toBe(false);
		expect(blockHasContent({ ...empty, items: [item] }, site)).toBe(false);
	});
	it("keeps an English-only text page reachable in other languages", () => {
		const page = localizePage(
			{
				id: "travel",
				slug: "travel",
				showInNav: true,
				translations: [
					{ locale: "de", title: "", intro: "" },
					{ locale: "en", title: "Travel", intro: "Directions" },
				],
				blocks: [
					{
						...empty,
						type: BlockType.TEXT,
						translations: [
							{ locale: "de", title: "", body: "<p><br></p>" },
							{ locale: "en", title: "", body: "Getting there" },
						],
						items: [],
					},
				],
			},
			"de"
		);
		expect(page.title).toBe("Travel");
		expect(visibleBlocks(page, site)).toHaveLength(1);
	});
});
