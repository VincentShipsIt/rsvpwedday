"use server";

import { revalidatePath } from "next/cache";
import type { Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";
import { processMediaCleanup, queueAbandonedPhotoUploads } from "@/lib/media-cleanup";
import { requireAdmin } from "@/lib/require-admin";
import { parseWireDatePreserving } from "@/lib/wire-date";

// The book lives at `/rsvp/<token>/memories`, one page per invitation token, so every guest's
// copy is stale after any change here.
function revalidateMemories() {
	revalidatePath("/admin/memories");
	revalidatePath("/rsvp/[token]/memories", "page");
}

export type MemoriesTranslationInput = { locale: Locale; photosTitle: string; photosIntro: string };
export type MemoriesInput = {
	photosEnabled: boolean;
	/** A `datetime-local` string, or empty for no date gate at all. */
	photosOpenAt: string;
	photosTestMode: boolean;
	translations: MemoriesTranslationInput[];
};

export async function updateMemories(input: MemoriesInput): Promise<FormActionResult> {
	await requireAdmin();
	const [settings, previousContent] = await Promise.all([
		db.settings.findUnique({ where: { id: 1 }, select: { timeZone: true } }),
		db.siteContent.findUnique({ where: { id: 1 }, select: { photosOpenAt: true } }),
	]);
	const openAt = input.photosOpenAt
		? parseWireDatePreserving(
				input.photosOpenAt,
				settings?.timeZone ?? "UTC",
				previousContent?.photosOpenAt ?? null
			)
		: null;
	if (input.photosOpenAt && openAt === null) {
		return { ok: false, error: "Enter a valid date and time for when the book opens." };
	}

	await db.$transaction(async (tx) => {
		await tx.siteContent.upsert({
			where: { id: 1 },
			create: {
				id: 1,
				photosEnabled: input.photosEnabled,
				photosOpenAt: openAt,
				photosTestMode: input.photosTestMode,
			},
			update: {
				photosEnabled: input.photosEnabled,
				photosOpenAt: openAt,
				photosTestMode: input.photosTestMode,
			},
		});

		for (const translation of input.translations) {
			await tx.siteContentTranslation.upsert({
				where: { siteContentId_locale: { siteContentId: 1, locale: translation.locale } },
				create: {
					siteContentId: 1,
					locale: translation.locale,
					photosTitle: translation.photosTitle,
					photosIntro: translation.photosIntro,
				},
				update: {
					photosTitle: translation.photosTitle,
					photosIntro: translation.photosIntro,
				},
			});
		}
	});

	revalidateMemories();
	return { ok: true };
}

// Hiding takes a photo out of every guest's book but keeps it here, so a hasty moderation call
// during the party can be undone the next morning.
export async function setPhotoHidden(photoId: string, hidden: boolean): Promise<FormActionResult> {
	await requireAdmin();
	await db.photo.update({
		where: { id: photoId },
		data: { hiddenAt: hidden ? new Date() : null },
	});
	revalidateMemories();
	return { ok: true };
}

/*
 * Takes a photo out of the book for good, as far as anyone using the site is concerned: it leaves
 * every guest's book and the moderation list, and only a restore brings it back.
 *
 * The stored file is deliberately left alone. Queueing it for storage cleanup would make this the
 * one delete that cannot be undone, because a restored row pointing at a deleted object is not a
 * photo. The cleanup pipeline still sweeps abandoned upload batches nobody registered — that is
 * what `retryPhotoCleanup` below drives — and whatever eventually purges tombstones is what should
 * take these files with them.
 */
export async function deletePhoto(photoId: string): Promise<FormActionResult> {
	await requireAdmin();
	await db.photo.updateMany({ where: { id: photoId }, data: { deletedAt: new Date() } });
	revalidateMemories();
	return { ok: true };
}

export async function retryPhotoCleanup(): Promise<FormActionResult & { pending?: number }> {
	await requireAdmin();
	await queueAbandonedPhotoUploads();
	const cleanup = await processMediaCleanup();
	revalidateMemories();
	return { ok: true, pending: cleanup.pending };
}
