import { describe, expect, it } from "vitest";
import {
	type BookPhoto,
	buildBookPages,
	buildLeaves,
	lastBookPosition,
	positionForPage,
	resolvePhotoBookAccess,
	visibleBookPage,
} from "@/domain/photo-book";

const now = new Date("2026-09-07T12:00:00Z");

function photo(id: string): BookPhoto {
	return { id, url: `https://example.com/${id}.jpg`, uploaderName: "Sam", caption: "" };
}

describe("resolvePhotoBookAccess", () => {
	it("is disabled while the couple has not switched the book on", () => {
		expect(resolvePhotoBookAccess({ enabled: false, openAt: null, testMode: true }, now)).toEqual({
			state: "disabled",
		});
	});

	it("is closed before the opening moment, and reports when it opens", () => {
		const opensAt = new Date("2026-09-08T15:00:00Z");
		expect(
			resolvePhotoBookAccess({ enabled: true, openAt: opensAt, testMode: false }, now)
		).toEqual({ state: "closed", opensAt });
	});

	it("opens once the moment has arrived, and stays open afterwards", () => {
		const opensAt = new Date("2026-09-07T12:00:00Z");
		expect(
			resolvePhotoBookAccess({ enabled: true, openAt: opensAt, testMode: false }, now)
		).toEqual({ state: "open" });
		expect(
			resolvePhotoBookAccess(
				{ enabled: true, openAt: new Date("2020-01-01T00:00:00Z"), testMode: false },
				now
			)
		).toEqual({ state: "open" });
	});

	it("opens with no date gate at all", () => {
		expect(resolvePhotoBookAccess({ enabled: true, openAt: null, testMode: false }, now)).toEqual({
			state: "open",
		});
	});

	it("test mode opens a book whose date has not arrived, without changing that date", () => {
		expect(
			resolvePhotoBookAccess(
				{ enabled: true, openAt: new Date("2030-01-01T00:00:00Z"), testMode: true },
				now
			)
		).toEqual({ state: "open" });
	});
});

describe("buildBookPages", () => {
	it("is still a book when nobody has added a photo yet", () => {
		expect(buildBookPages([], false)).toEqual([{ kind: "cover" }, { kind: "end" }]);
	});

	it("puts the intro after the cover only when there is one", () => {
		expect(buildBookPages([], true).map((page) => page.kind)).toEqual(["cover", "intro", "end"]);
	});

	it("keeps the photos in the order they were given, between the intro and the end", () => {
		const pages = buildBookPages([photo("a"), photo("b")], true);
		expect(pages.map((page) => page.kind)).toEqual(["cover", "intro", "photo", "photo", "end"]);
		expect(pages.flatMap((page) => (page.kind === "photo" ? [page.photo.id] : []))).toEqual([
			"a",
			"b",
		]);
	});
});

describe("buildLeaves", () => {
	it("gives every page its own leaf in single-page mode", () => {
		const pages = buildBookPages([photo("a")], false);
		expect(buildLeaves(pages, 1)).toEqual([[pages[0]], [pages[1]], [pages[2]]]);
	});

	it("pairs pages front-to-back in spread mode", () => {
		const pages = buildBookPages([photo("a"), photo("b")], false);
		expect(buildLeaves(pages, 2)).toEqual([
			[pages[0], pages[1]],
			[pages[2], pages[3]],
		]);
	});

	it("leaves the back of the final sheet blank when the page count is odd", () => {
		const pages = buildBookPages([photo("a")], false);
		expect(pages).toHaveLength(3);
		expect(buildLeaves(pages, 2)).toEqual([
			[pages[0], pages[1]],
			[pages[2], null],
		]);
	});
});

describe("book reading positions", () => {
	it("makes all front and back pages reachable for both layouts and every book shape", () => {
		for (const hasIntro of [false, true]) {
			for (let count = 0; count < 8; count += 1) {
				const pages = buildBookPages(
					Array.from({ length: count }, (_, index) => photo(`${index}`)),
					hasIntro
				);
				for (const perLeaf of [1, 2] as const) {
					const last = lastBookPosition(pages.length, perLeaf);
					for (let page = 0; page < pages.length; page += 1) {
						const position = positionForPage(page, perLeaf);
						expect(position).toBeLessThanOrEqual(last);
						expect(
							perLeaf === 1 ? position === page : position * 2 === page || position * 2 - 1 === page
						).toBe(true);
					}
				}
			}
		}
	});

	it("lets a cover/end-only desktop book open to its closing back face", () => {
		expect(lastBookPosition(2, 2)).toBe(1);
		expect(visibleBookPage(1, 2, 2)).toBe(1);
	});

	it("locates the newest photo instead of the closing page on a phone", () => {
		const pages = buildBookPages([photo("old"), photo("new")], true);
		const newest = pages.findLastIndex((page) => page.kind === "photo");
		expect(positionForPage(newest, 1)).toBe(3);
		expect(pages[positionForPage(newest, 1)]).toEqual({ kind: "photo", photo: photo("new") });
	});

	it("preserves the final visible page when resizing a desktop book to mobile", () => {
		const page = visibleBookPage(3, 2, 6);
		expect(positionForPage(page, 1)).toBe(5);
		expect(positionForPage(page, 2)).toBe(3);
	});
});
