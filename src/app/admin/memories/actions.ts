"use server";

import { revalidatePath } from "next/cache";
import type { Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";
import {
	processMediaCleanup,
	queueAbandonedPhotoUploads,
	queuePhotoMediaCleanup,
} from "@/lib/media-cleanup";
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

export async function deletePhoto(
	photoId: string
): Promise<FormActionResult & { cleanupPending?: boolean; legacy?: boolean }> {
	await requireAdmin();
	const outcome = await db.$transaction(async (tx) => {
		const photo = await tx.photo.findUnique({ where: { id: photoId } });
		if (!photo) return { legacy: false };
		await tx.$queryRaw`SELECT id FROM "Invitation" WHERE id = ${photo.invitationId} FOR UPDATE`;
		if (photo.uploadReceiptId) await queuePhotoMediaCleanup(tx, photo.uploadReceiptId);
		await tx.photo.deleteMany({ where: { id: photoId } });
		return { legacy: photo.uploadReceiptId === null };
	});
	const cleanup = await processMediaCleanup();
	revalidateMemories();
	return { ok: true, cleanupPending: cleanup.pending > 0, legacy: outcome.legacy };
}

export async function retryPhotoCleanup(): Promise<FormActionResult & { pending?: number }> {
	await requireAdmin();
	await queueAbandonedPhotoUploads();
	const cleanup = await processMediaCleanup();
	revalidateMemories();
	return { ok: true, pending: cleanup.pending };
}
