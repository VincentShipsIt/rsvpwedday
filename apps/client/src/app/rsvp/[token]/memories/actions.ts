"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MAX_CAPTION_LENGTH, MAX_PHOTO_BATCH } from "@/domain/photo-book";
import { isBlobConfigured } from "@/lib/blob";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";
import {
	createPhotoReceipt,
	requirePhotoInvitation,
	verifyPhotoReceipt,
} from "@/lib/photo-receipts";

const addPhotosSchema = z.object({
	uploaderName: z.string().trim().min(1).max(80),
	caption: z.string().trim().max(MAX_CAPTION_LENGTH),
	receiptIds: z.array(z.uuid()).min(1).max(MAX_PHOTO_BATCH),
});
export type AddPhotosInput = z.infer<typeof addPhotosSchema>;

export async function preparePhotoUpload(token: string) {
	if (!isBlobConfigured()) throw new Error("Photo uploads are unavailable");
	const invitation = await requirePhotoInvitation(token);
	const receipt = await createPhotoReceipt(invitation.id);
	return { id: receipt.id, pathname: receipt.pathname };
}

export async function addPhotos(token: string, input: AddPhotosInput): Promise<FormActionResult> {
	const parsed = addPhotosSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: "Invalid photo upload" };
	try {
		const invitation = await requirePhotoInvitation(token);
		const receipts = await Promise.all(
			[...new Set(parsed.data.receiptIds)].map((id) => verifyPhotoReceipt(id, invitation.id))
		);
		await db.$transaction(async (tx) => {
			await tx.$queryRaw`SELECT id FROM "Invitation" WHERE id = ${invitation.id} FOR UPDATE`;
			await tx.invitation.findUniqueOrThrow({ where: { id: invitation.id } });
			for (const receipt of receipts) {
				if (!receipt.url) throw new Error("The uploaded photo is still processing");
				if (await tx.mediaCleanup.findUnique({ where: { receiptId: receipt.id } }))
					throw new Error("This upload has been removed");
				// Same-receipt retries are idempotent: they neither duplicate nor edit a saved photo.
				await tx.photo.upsert({
					where: { uploadReceiptId: receipt.id },
					update: {},
					create: {
						invitationId: invitation.id,
						uploadReceiptId: receipt.id,
						url: receipt.url,
						uploaderName: parsed.data.uploaderName,
						caption: parsed.data.caption,
					},
				});
			}
		});
		revalidatePath(`/rsvp/${token}/memories`);
		return { ok: true };
	} catch {
		return {
			ok: false,
			error: "Could not save this upload. Please retry; completed photos are kept.",
		};
	}
}
