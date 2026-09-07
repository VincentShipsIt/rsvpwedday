"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import type { Locale } from "@/generated/prisma/enums";
import { isBlobConfigured } from "@/lib/blob";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import type { FormActionResult } from "@/lib/form-action";

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
	// The browser sends `datetime-local` with no zone, so it is read in the server's zone — which
	// on Vercel is UTC. That is why the form spells the resolved moment out underneath the field.
	const openAt = input.photosOpenAt ? new Date(input.photosOpenAt) : null;
	if (openAt !== null && Number.isNaN(openAt.getTime())) {
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
	await db.photo.update({
		where: { id: photoId },
		data: { hiddenAt: hidden ? new Date() : null },
	});
	revalidateMemories();
	return { ok: true };
}

// A real delete: the row goes, and so does the file, so "remove this photo" means it is gone from
// the Blob store too rather than merely unlinked. A store that has already lost the file (or is
// not configured at all) must not block removing the row.
export async function deletePhoto(photoId: string): Promise<FormActionResult> {
	const photo = await db.photo.findUnique({ where: { id: photoId }, select: { url: true } });
	await db.photo.delete({ where: { id: photoId } });

	if (photo && isBlobConfigured()) {
		try {
			await del(photo.url, { token: env.BLOB_READ_WRITE_TOKEN });
		} catch {
			// Left behind in the store; the guest-facing book no longer references it either way.
		}
	}

	revalidateMemories();
	return { ok: true };
}
