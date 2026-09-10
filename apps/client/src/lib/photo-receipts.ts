import { randomUUID } from "node:crypto";
import { head } from "@vercel/blob";
import { resolvePhotoBookAccess } from "@/domain/photo-book";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

export async function requirePhotoInvitation(token: string) {
	const [invitation, content] = await Promise.all([
		db.invitation.findUnique({ where: { token }, select: { id: true } }),
		db.siteContent.findUnique({ where: { id: 1 } }),
	]);
	if (!invitation) throw new Error("Invitation not found");
	if (
		resolvePhotoBookAccess(
			{
				enabled: content?.photosEnabled ?? false,
				openAt: content?.photosOpenAt ?? null,
				testMode: content?.photosTestMode ?? false,
			},
			new Date()
		).state !== "open"
	)
		throw new Error("The photo book is not open");
	return invitation;
}

export async function createPhotoReceipt(invitationId: string) {
	const id = randomUUID();
	return db.photoUploadReceipt.create({
		data: {
			id,
			invitationId,
			pathname: `guest-media/${invitationId}/${id}`,
			expiresAt: new Date(Date.now() + 10 * 60_000),
		},
	});
}

// Query the configured store by the server-reserved pathname, never a client-provided URL.
// The upload token permits exactly this path, with overwrite and random suffix both disabled.
// This also works locally, where Blob's signed completion webhook cannot reach localhost.
export async function verifyPhotoReceipt(receiptId: string, invitationId: string) {
	const receipt = await db.photoUploadReceipt.findUnique({
		where: { id: receiptId },
		include: { cleanup: true },
	});
	if (!receipt || receipt.invitationId !== invitationId || receipt.cleanup) {
		throw new Error("This upload does not belong to this invitation");
	}
	if (receipt.url) return receipt;
	const blob = await head(receipt.pathname, { token: env.BLOB_READ_WRITE_TOKEN });
	if (
		blob.pathname !== receipt.pathname ||
		!blob.contentType.startsWith("image/") ||
		blob.size > MAX_UPLOAD_BYTES
	) {
		throw new Error("The uploaded photo could not be verified");
	}
	return db.photoUploadReceipt.update({ where: { id: receipt.id }, data: { url: blob.url } });
}
