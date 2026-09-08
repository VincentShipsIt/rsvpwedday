import { BlobNotFoundError, del, head } from "@vercel/blob";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export async function queuePhotoMediaCleanup(tx: Prisma.TransactionClient, receiptId: string) {
	const receipt = await tx.photoUploadReceipt.findUniqueOrThrow({ where: { id: receiptId } });
	// Wait for issued upload tokens to expire so a late upload cannot recreate a deleted object.
	await tx.mediaCleanup.upsert({
		where: { receiptId },
		create: { receiptId, readyAt: new Date(receipt.expiresAt.getTime() + 5 * 60_000) },
		update: {},
	});
}

// Call in the same transaction as deleting the invitation. Registration locks this row too.
export async function queueInvitationMediaCleanup(
	tx: Prisma.TransactionClient,
	invitationId: string
) {
	await tx.$queryRaw`SELECT id FROM "Invitation" WHERE id = ${invitationId} FOR UPDATE`;
	const receipts = await tx.photoUploadReceipt.findMany({ where: { invitationId } });
	for (const receipt of receipts) await queuePhotoMediaCleanup(tx, receipt.id);
	const legacyCount = await tx.photo.count({ where: { invitationId, uploadReceiptId: null } });
	return { queued: receipts.length, legacyCount };
}

// Expired, unregistered uploads are abandoned batches. Their reserved paths are safe to clean;
// legacy URLs with no receipt are deliberately never passed to the storage deletion API.
export async function queueAbandonedPhotoUploads() {
	await db.$transaction(async (tx) => {
		const receipts = await tx.photoUploadReceipt.findMany({
			where: {
				expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) },
				photo: null,
				cleanup: null,
			},
			take: 100,
		});
		for (const receipt of receipts) {
			await tx.$queryRaw`SELECT id FROM "Invitation" WHERE id = ${receipt.invitationId} FOR UPDATE`;
			if (!(await tx.photo.findUnique({ where: { uploadReceiptId: receipt.id } })))
				await queuePhotoMediaCleanup(tx, receipt.id);
		}
	});
}

export async function processMediaCleanup(limit = 50) {
	const jobs = await db.mediaCleanup.findMany({
		where: { completedAt: null, readyAt: { lte: new Date() } },
		include: { receipt: true },
		orderBy: { createdAt: "asc" },
		take: limit,
	});
	let completed = 0;
	for (const job of jobs) {
		try {
			if (!env.BLOB_READ_WRITE_TOKEN) throw new Error("Blob storage is not configured");
			try {
				const blob = await head(job.receipt.pathname, { token: env.BLOB_READ_WRITE_TOKEN });
				if (blob.pathname !== job.receipt.pathname) throw new Error("Storage pathname mismatch");
				await del(blob.url, { token: env.BLOB_READ_WRITE_TOKEN });
			} catch (error) {
				if (!(error instanceof BlobNotFoundError)) throw error;
			}
			await db.mediaCleanup.update({
				where: { id: job.id },
				data: {
					completedAt: new Date(),
					lastError: null,
					attempts: { increment: 1 },
				},
			});
			completed += 1;
		} catch {
			await db.mediaCleanup.update({
				where: { id: job.id },
				data: {
					lastError: "Storage removal failed. Retry when Blob storage is available.",
					attempts: { increment: 1 },
				},
			});
		}
	}
	return { completed, pending: await db.mediaCleanup.count({ where: { completedAt: null } }) };
}
