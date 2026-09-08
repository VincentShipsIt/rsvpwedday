import { describe, expect, it } from "vitest";
import {
	canRelease,
	type GiftView,
	giftStatus,
	localizeGift,
	publishableGifts,
	sortByAvailability,
	summarizeGifts,
} from "@/domain/gifts";
import { Locale } from "@/generated/prisma/enums";

function gift(id: string, claim: GiftView["claim"] = null): GiftView {
	return {
		id,
		imageUrl: null,
		url: null,
		price: "",
		title: id,
		body: "",
		claim,
	};
}

describe("giftStatus", () => {
	it("is available while nobody has taken it", () => {
		expect(giftStatus(gift("kettle"), "household-1")).toBe("available");
	});

	it("is mine for the household that took it, taken for everyone else", () => {
		const claimed = gift("kettle", { invitationId: "household-1", guestName: "Sam" });
		expect(giftStatus(claimed, "household-1")).toBe("mine");
		expect(giftStatus(claimed, "household-2")).toBe("taken");
	});

	it("is taken, never mine, for a reader with no invitation of their own", () => {
		const claimed = gift("kettle", { invitationId: "household-1", guestName: "Sam" });
		expect(giftStatus(claimed, null)).toBe("taken");
		expect(giftStatus(gift("kettle"), null)).toBe("available");
	});
});

describe("canRelease", () => {
	it("lets a household take back only its own reservation", () => {
		const mine = gift("kettle", { invitationId: "household-1", guestName: "Sam" });
		expect(canRelease(mine, "household-1")).toBe(true);
		expect(canRelease(mine, "household-2")).toBe(false);
		expect(canRelease(gift("kettle"), "household-1")).toBe(false);
	});
});

describe("summarizeGifts", () => {
	it("counts an empty list without dividing anything by zero", () => {
		expect(summarizeGifts([])).toEqual({ total: 0, taken: 0, available: 0 });
	});

	it("splits the list into taken and still available", () => {
		const gifts = [
			gift("a", { invitationId: "household-1", guestName: "Sam" }),
			gift("b"),
			gift("c", { invitationId: "household-2", guestName: "Robin" }),
		];
		expect(summarizeGifts(gifts)).toEqual({ total: 3, taken: 2, available: 1 });
	});
});

describe("sortByAvailability", () => {
	it("floats what is still available to the top, keeping the couple's order inside each group", () => {
		const gifts = [
			gift("a", { invitationId: "household-1", guestName: "Sam" }),
			gift("b"),
			gift("c", { invitationId: "household-2", guestName: "Robin" }),
			gift("d"),
		];
		expect(sortByAvailability(gifts).map((entry) => entry.id)).toEqual(["b", "d", "a", "c"]);
	});

	it("leaves the caller's array alone", () => {
		const gifts = [gift("a", { invitationId: "household-1", guestName: "Sam" }), gift("b")];
		sortByAvailability(gifts);
		expect(gifts.map((entry) => entry.id)).toEqual(["a", "b"]);
	});
});

describe("localizeGift", () => {
	const record = {
		id: "riad",
		imageUrl: null,
		url: "https://example.com/riad",
		price: "€120",
		claim: null,
		translations: [
			{ locale: Locale.en, title: "Two nights in a riad", body: "<p>Marrakesh</p>" },
			{ locale: Locale.de, title: "Zwei Nächte im Riad", body: "" },
		],
	};

	it("uses the requested locale", () => {
		expect(localizeGift(record, Locale.de).title).toBe("Zwei Nächte im Riad");
	});

	it("falls back to the first translation that exists, so one language is never a blank card", () => {
		expect(localizeGift(record, Locale.ku).title).toBe("Two nights in a riad");
	});

	it("keeps the fields that are the same in every language", () => {
		expect(localizeGift(record, Locale.en)).toMatchObject({
			id: "riad",
			url: "https://example.com/riad",
			price: "€120",
			claim: null,
		});
	});

	it("survives a gift with no translation rows at all", () => {
		expect(localizeGift({ ...record, translations: [] }, Locale.en)).toMatchObject({
			title: "",
			body: "",
		});
	});
});

describe("publishableGifts", () => {
	it("drops a half-added row, so an unnamed gift is never something a guest can reserve", () => {
		const gifts = [gift("kettle"), { ...gift("blank"), title: "   " }];
		expect(publishableGifts(gifts).map((entry) => entry.id)).toEqual(["kettle"]);
	});
});
