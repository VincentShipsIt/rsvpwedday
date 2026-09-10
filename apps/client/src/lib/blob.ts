import { put } from "@vercel/blob";
import { env } from "@/lib/env";
import { MAX_UPLOAD_BYTES, type UploadResult as UploadImageResult } from "@/lib/upload-limits";

export { MAX_UPLOAD_BYTES, type UploadImageResult };

// Read on the server and passed to the upload fields as a prop, so the client bundle never
// touches `env`. Uploads themselves run in the browser (`blob-upload.ts`) against a client token
// minted by `src/app/admin/upload/route.ts`.
export function isBlobConfigured(): boolean {
	return Boolean(env.BLOB_READ_WRITE_TOKEN);
}

/*
 * Replicate serves a finished prediction from a URL that expires within the hour, so a generated
 * illustration is copied into the same Blob store as an uploaded photo before it is handed back
 * to the admin — otherwise the site would quietly lose the image later. Images are small enough
 * to buffer, and this runs on the server, so no Server Action body limit applies.
 */
export async function copyImageToBlob(sourceUrl: string): Promise<UploadImageResult> {
	const token = env.BLOB_READ_WRITE_TOKEN;
	if (!token) {
		return { ok: false, error: "Storing a generated image needs a Blob store." };
	}

	const response = await fetch(sourceUrl);
	if (!response.ok) {
		return { ok: false, error: `Could not download the generated image (${response.status}).` };
	}

	const contentType = response.headers.get("content-type") ?? "image/jpeg";
	const body = await response.arrayBuffer();
	if (body.byteLength > MAX_UPLOAD_BYTES) {
		return { ok: false, error: "The generated image was larger than the upload limit." };
	}

	const blob = await put("generated-illustration.jpg", body, {
		access: "public",
		token,
		contentType,
		addRandomSuffix: true,
	});
	return { ok: true, url: blob.url };
}
