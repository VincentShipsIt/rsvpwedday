import { describe, expect, it } from "vitest";
import {
	isRetiredUniqueValue,
	isSoftDeletedModel,
	restoreUniqueValue,
	retireUniqueValue,
	SOFT_DELETED_MODELS,
} from "@/domain/soft-delete";

const at = new Date("2026-09-08T12:00:00Z");

describe("isSoftDeletedModel", () => {
	it("covers everything the couple can remove", () => {
		for (const model of [
			"event",
			"page",
			"block",
			"blockItem",
			"gift",
			"storyMilestone",
			"invitation",
			"guest",
			"photo",
		]) {
			expect(isSoftDeletedModel(model)).toBe(true);
		}
	});

	/*
	 * These are the ones where the delete is the feature. Tombstoning a GiftClaim would make its
	 * gift unreservable forever (the claim's primary key is the gift id), and an EventAttendance
	 * tombstone would block ever re-inviting a household to that event.
	 */
	it("excludes the mechanical deletes and the rows rewritten on every save", () => {
		for (const model of [
			"giftClaim",
			"eventAttendance",
			"eventTranslation",
			"blockTranslation",
			"giftTranslation",
			"emailLog",
			"settings",
		]) {
			expect(isSoftDeletedModel(model)).toBe(false);
		}
	});

	/*
	 * A Prisma extension is handed the schema's own spelling ("Gift", "StoryMilestone") while the
	 * client's delegates are camel-case. Matching only one of the two silently switched the whole
	 * filter off once, and every deleted row came back.
	 */
	it("matches the schema's spelling as well as the client's", () => {
		expect(isSoftDeletedModel("Gift")).toBe(true);
		expect(isSoftDeletedModel("StoryMilestone")).toBe(true);
		expect(isSoftDeletedModel("BlockItem")).toBe(true);
		expect(isSoftDeletedModel("GiftClaim")).toBe(false);
		expect(isSoftDeletedModel("EventAttendance")).toBe(false);
	});

	it("says no to an unknown model and to nothing at all", () => {
		expect(isSoftDeletedModel("nonsense")).toBe(false);
		expect(isSoftDeletedModel(undefined)).toBe(false);
	});

	it("lists each model once", () => {
		expect(new Set(SOFT_DELETED_MODELS).size).toBe(SOFT_DELETED_MODELS.length);
	});
});

describe("retireUniqueValue", () => {
	it("moves a value out of the live namespace so a new row can take it", () => {
		const retired = retireUniqueValue("welcome-dinner", at);
		expect(retired).not.toBe("welcome-dinner");
		expect(retired.startsWith("welcome-dinner")).toBe(true);
	});

	it("round-trips back to the original", () => {
		expect(restoreUniqueValue(retireUniqueValue("welcome-dinner", at))).toBe("welcome-dinner");
		expect(restoreUniqueValue(retireUniqueValue("sam@example.com", at))).toBe("sam@example.com");
	});

	it("does not nest markers when something is deleted twice", () => {
		const once = retireUniqueValue("guide", at);
		const twice = retireUniqueValue(once, new Date("2027-01-01T00:00:00Z"));
		expect(twice).toBe(once);
		expect(restoreUniqueValue(twice)).toBe("guide");
	});

	it("gives two rows retired at different moments different values", () => {
		const first = retireUniqueValue("guide", at);
		const second = retireUniqueValue("guide", new Date("2026-09-09T12:00:00Z"));
		expect(first).not.toBe(second);
	});

	it("leaves a live value alone", () => {
		expect(restoreUniqueValue("welcome-dinner")).toBe("welcome-dinner");
		expect(isRetiredUniqueValue("welcome-dinner")).toBe(false);
		expect(isRetiredUniqueValue(retireUniqueValue("welcome-dinner", at))).toBe(true);
	});
});
