import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isBlobConfigured } from "@/lib/blob";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { requirePhotoInvitation } from "@/lib/photo-receipts";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
	if (!isBlobConfigured())
		return NextResponse.json({ error: "Photo uploads are unavailable." }, { status: 503 });
	try {
		const { token } = await params;
		const body = (await request.json()) as HandleUploadBody;
		const result = await handleUpload({
			body,
			request,
			token: env.BLOB_READ_WRITE_TOKEN,
			onBeforeGenerateToken: async (pathname, receiptId) => {
				const invitation = await requirePhotoInvitation(token);
				const receipt = await db.$transaction(async (tx) => {
					await tx.$queryRaw`SELECT id FROM "Invitation" WHERE id = ${invitation.id} FOR UPDATE`;
					await tx.invitation.findUniqueOrThrow({ where: { id: invitation.id } });
					const reserved = receiptId
						? await tx.photoUploadReceipt.findUnique({
								where: { id: receiptId },
								include: { cleanup: true, photo: true },
							})
						: null;
					if (
						!reserved ||
						reserved.invitationId !== invitation.id ||
						reserved.pathname !== pathname ||
						reserved.cleanup ||
						reserved.photo
					) {
						throw new Error("Invalid upload reservation");
					}
					// A retry may need a fresh short-lived token for the same path. Household deletion
					// shares this lock and captures the renewed expiry before scheduling storage removal.
					return tx.photoUploadReceipt.update({
						where: { id: reserved.id },
						data: {
							expiresAt: new Date(Date.now() + 10 * 60_000),
						},
					});
				});
				return {
					allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
					maximumSizeInBytes: MAX_UPLOAD_BYTES,
					addRandomSuffix: false,
					allowOverwrite: false,
					validUntil: receipt.expiresAt.getTime(),
					tokenPayload: receipt.id,
				};
			},
			// handleUpload authenticates the Blob signature before entering this callback. It must
			// still be accepted after the book closes or a household is deleted, to retain cleanup.
			onUploadCompleted: async ({ blob, tokenPayload }) => {
				const receipt = tokenPayload
					? await db.photoUploadReceipt.findUnique({ where: { id: tokenPayload } })
					: null;
				if (!receipt || receipt.pathname !== blob.pathname)
					throw new Error("Invalid upload receipt");
				await db.$transaction(async (tx) => {
					await tx.photoUploadReceipt.update({
						where: { id: receipt.id },
						data: { url: blob.url },
					});
					// A very slow transfer can complete after an earlier cleanup attempt found no object.
					await tx.mediaCleanup.updateMany({
						where: { receiptId: receipt.id },
						data: {
							completedAt: null,
							readyAt: new Date(Math.max(Date.now(), receipt.expiresAt.getTime() + 5 * 60_000)),
						},
					});
				});
			},
		});
		return NextResponse.json(result);
	} catch {
		return NextResponse.json({ error: "Photo upload could not be authorized." }, { status: 400 });
	}
}
