import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isBlobConfigured } from "@/lib/blob";
import { env } from "@/lib/env";
import { requireAdmin } from "@/lib/require-admin";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

// Issues short-lived client tokens so the browser uploads straight to Blob. Files never pass
// through a Server Action: Vercel caps a function request body at 4.5 MB (a 413 before our own
// 8 MB check could even run), which is what a normal MP3 hit. `src/proxy.ts` already gates every
// `/admin/*` path behind the session cookie, so an unauthenticated caller is redirected before
// reaching this handler.
export async function POST(request: Request): Promise<NextResponse> {
	if (!isBlobConfigured()) {
		return NextResponse.json(
			{ error: "Uploads need a Blob store (BLOB_READ_WRITE_TOKEN)." },
			{ status: 503 }
		);
	}

	const body = (await request.json()) as HandleUploadBody;
	try {
		const result = await handleUpload({
			body,
			request,
			token: env.BLOB_READ_WRITE_TOKEN,
			onBeforeGenerateToken: async (_pathname, clientPayload) => {
				await requireAdmin();
				return {
					allowedContentTypes: clientPayload === "audio" ? ["audio/*"] : ["image/*"],
					maximumSizeInBytes: MAX_UPLOAD_BYTES,
					addRandomSuffix: true,
				};
			},
			onUploadCompleted: async () => {},
		});
		return NextResponse.json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Upload failed.";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
