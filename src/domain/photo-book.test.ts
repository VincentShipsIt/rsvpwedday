import { describe, expect, it } from "vitest";
import {
	type BookPhoto,
	buildBookPages,
	buildLeaves,
	resolvePhotoBookAccess,
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
