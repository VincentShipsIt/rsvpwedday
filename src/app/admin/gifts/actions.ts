"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAllowedImageUrl } from "@/domain/image-url";
import { sanitizeRichText } from "@/domain/rich-text";
import type { Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";
import { requireAdmin } from "@/lib/require-admin";

const imageUrlSchema = z.string().refine((value) => value === "" || isAllowedImageUrl(value), {
	message: "must be a valid https image URL",
});

// The wish list shows up on the couple's admin, on every guest's own page and on whichever public
// pages carry a wish-list block.
function revalidateGifts() {
	revalidatePath("/admin/gifts");
	revalidatePath("/rsvp/[token]/gifts", "page");
	revalidatePath("/", "layout");
}

export type GiftTranslationInput = { locale: Locale; title: string; body: string };
export type GiftInput = {
	id?: string;
	sortOrder: number;
	imageUrl: string;
	url: string;
	price: string;
	translations: GiftTranslationInput[];
};
export type GiftsInput = { gifts: GiftInput[] };

/*
 * Saves the whole list, the way the milestones form does: rows the client no longer sends are
 * deleted, the rest are updated in place.
 *
 * Deleting a gift takes its reservation with it (`GiftClaim` cascades), which is the right
 * outcome — a gift the couple removed is not one anybody should still be bringing — but it is why
 * the form asks before removing a row somebody has already taken.
 */
export async function updateGifts(input: GiftsInput): Promise<FormActionResult> {
	await requireAdmin();
	for (const [index, gift] of input.gifts.entries()) {
		if (!imageUrlSchema.safeParse(gift.imageUrl).success) {
			return { ok: false, error: `Enter a valid https image URL for gift #${index + 1}.` };
		}
		if (gift.url !== "" && !/^https?:\/\//i.test(gift.url)) {
			return { ok: false, error: `Gift #${index + 1}'s link must start with https://.` };
		}
	}

	// Duplicate `sortOrder` values could otherwise persist across saves (two gifts both added
	// client-side before a save), so every save re-derives 0..n-1 from the submitted order.
	const normalized = [...input.gifts]
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.map((gift, index) => ({ ...gift, sortOrder: index }));

	const existing = await db.gift.findMany({ select: { id: true } });
	const existingIds = new Set(existing.map((gift) => gift.id));
	const submittedIds = new Set(normalized.filter((gift) => gift.id).map((gift) => gift.id));

	await db.$transaction(async (tx) => {
		for (const giftId of existingIds) {
			if (!submittedIds.has(giftId)) {
				// The reservation goes with it: a gift nobody can see is not one anybody is still
				// bringing. Claims are not soft-deleted, so restoring the gift puts it back as
				// available.
				await tx.giftClaim.deleteMany({ where: { giftId } });
				await tx.gift.update({ where: { id: giftId }, data: { deletedAt: new Date() } });
			}
		}

		for (const gift of normalized) {
			const data = {
				sortOrder: gift.sortOrder,
				imageUrl: gift.imageUrl || null,
				url: gift.url || null,
				price: gift.price,
			};

			if (gift.id && existingIds.has(gift.id)) {
				await tx.gift.update({ where: { id: gift.id }, data });
				for (const translation of gift.translations) {
					await tx.giftTranslation.upsert({
						where: { giftId_locale: { giftId: gift.id, locale: translation.locale } },
						create: {
							giftId: gift.id,
							locale: translation.locale,
							title: translation.title,
							body: sanitizeRichText(translation.body),
						},
						update: {
							title: translation.title,
							body: sanitizeRichText(translation.body),
						},
					});
				}
			} else {
				await tx.gift.create({
					data: {
						// The id is minted client-side so the very first save is already an update
						// against a stable row, the way a block's items are.
						...(gift.id ? { id: gift.id } : {}),
						...data,
						translations: {
							create: gift.translations.map((translation) => ({
								locale: translation.locale,
								title: translation.title,
								body: sanitizeRichText(translation.body),
							})),
						},
					},
				});
			}
		}
	});

	revalidateGifts();
	return { ok: true };
}

/*
 * Puts a gift back on the list on the couple's say-so — for the guest who emails to say they
 * cannot manage it after all, rather than releasing it themselves.
 */
export async function releaseClaim(
	giftId: string,
	claimVersion: string | null
): Promise<FormActionResult> {
	await requireAdmin();
	if (!giftId || (claimVersion !== null && typeof claimVersion !== "string")) {
		return { ok: false, error: "Refresh the gift list before releasing this reservation." };
	}
	const result = await db.giftClaim.deleteMany({ where: { giftId, version: claimVersion } });
	revalidateGifts();
	if (result.count === 0)
		return {
			ok: false,
			error:
				"This reservation changed. The current reservation has been kept; review the refreshed list.",
		};
	return { ok: true };
}
