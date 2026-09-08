import { describe, expect, it } from "vitest";
import { localizeGift, publishableGifts } from "@/domain/gifts";
import { populatedTranslation } from "@/domain/translations";

describe("populated translations", () => {
	it("falls back per field without replacing real translated copy", () => {
		const translations = [
			{ locale: "ku" as const, title: "", body: "<p>&nbsp;</p>" },
			{ locale: "en" as const, title: "Travel", body: "<p>English directions</p>" },
			{ locale: "de" as const, title: "Anreise", body: "<p><br></p>" },
		];
		expect(populatedTranslation(translations, "de", ["title", "body"])).toEqual({
			title: "Anreise",
			body: "<p>English directions</p>",
		});
		expect(populatedTranslation([...translations].reverse(), "ku", ["title", "body"])).toEqual({
			title: "Travel",
			body: "<p>English directions</p>",
		});
	});
	it("keeps English-only gifts available in every locale and hides genuinely empty gifts", () => {
		const gift = {
			id: "gift",
			imageUrl: null,
			url: null,
			price: "",
			claim: null,
			translations: [
				{ locale: "en" as const, title: "Honeymoon", body: "" },
				{ locale: "de" as const, title: "", body: "" },
			],
		};
		for (const locale of ["en", "de", "ku"] as const)
			expect(publishableGifts([localizeGift(gift, locale)])).toHaveLength(1);
		expect(publishableGifts([localizeGift({ ...gift, translations: [] }, "de")])).toHaveLength(0);
	});
});
