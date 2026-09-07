"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAllowedImageUrl } from "@/domain/image-url";
import { MAX_CAPTION_LENGTH, resolvePhotoBookAccess } from "@/domain/photo-book";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";

const addPhotosSchema = z.object({
	uploaderName: z.string().trim().min(1).max(80),
	caption: z.string().trim().max(MAX_CAPTION_LENGTH),
	urls: z
		.array(z.string().refine(isAllowedImageUrl, { message: "must be a valid https image URL" }))
		.min(1)
		.max(20),
});

export type AddPhotosInput = z.infer<typeof addPhotosSchema>;

/*
 * Records photos the guest's browser has already put in the Blob store (see the sibling
 * `upload/route.ts`). The token is re-checked here rather than trusted from the upload step: this
 * action is reachable on its own, and the same two questions — is this a real invitation, is the
 * book open — decide both.
 */
export async function addPhotos(token: string, input: AddPhotosInput): Promise<FormActionResult> {
	const parsed = addPhotosSchema.safeParse(input);
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid photo" };
	}

	const [invitation, siteContent] = await Promise.all([
		db.invitation.findUnique({ where: { token }, select: { id: true } }),
		db.siteContent.findUnique({
			where: { id: 1 },
			select: { photosEnabled: true, photosOpenAt: true, photosTestMode: true },
		}),
	]);

	if (!invitation) {
		return { ok: false, error: "Invitation not found" };
	}

	const access = resolvePhotoBookAccess(
		{
			enabled: siteContent?.photosEnabled ?? false,
			openAt: siteContent?.photosOpenAt ?? null,
			testMode: siteContent?.photosTestMode ?? false,
		},
		new Date()
	);
	if (access.state !== "open") {
		return { ok: false, error: "The photo book is not open" };
	}

	await db.photo.createMany({
		data: parsed.data.urls.map((url) => ({
			invitationId: invitation.id,
			url,
			uploaderName: parsed.data.uploaderName,
			caption: parsed.data.caption,
		})),
	});

	revalidatePath(`/rsvp/${token}/memories`);
	return { ok: true };
}
