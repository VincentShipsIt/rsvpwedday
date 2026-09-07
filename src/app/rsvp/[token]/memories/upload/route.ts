import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { resolvePhotoBookAccess } from "@/domain/photo-book";
import { isBlobConfigured } from "@/lib/blob";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

/*
 * The guest counterpart of `src/app/admin/upload/route.ts`: it mints the short-lived client token
 * that lets a phone upload straight to Blob, so a 6 MB photo never passes through a Server Action
 * and its 4.5 MB body cap. Nothing here is behind the admin cookie, so the invitation token in the
 * path is the credential — an unknown token, or a book that is not open yet, gets no token and
 * therefore cannot write anything to the store.
 */
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
	if (!isBlobConfigured()) {
		return NextResponse.json(
			{ error: "Uploads need a Blob store (BLOB_READ_WRITE_TOKEN)." },
			{ status: 503 }
		);
	}

	const { token } = await params;
	const [invitation, siteContent] = await Promise.all([
		db.invitation.findUnique({ where: { token }, select: { id: true } }),
		db.siteContent.findUnique({
			where: { id: 1 },
			select: { photosEnabled: true, photosOpenAt: true, photosTestMode: true },
		}),
	]);

	if (!invitation) {
		return NextResponse.json({ error: "Unknown invitation." }, { status: 404 });
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
		return NextResponse.json({ error: "The photo book is not open." }, { status: 403 });
	}

	const body = (await request.json()) as HandleUploadBody;
	try {
		const result = await handleUpload({
			body,
			request,
			token: env.BLOB_READ_WRITE_TOKEN,
			onBeforeGenerateToken: async () => ({
				allowedContentTypes: ["image/*"],
				maximumSizeInBytes: MAX_UPLOAD_BYTES,
				addRandomSuffix: true,
			}),
			onUploadCompleted: async () => {},
		});
		return NextResponse.json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Upload failed.";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
