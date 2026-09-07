import { env } from "@/lib/env";

export { MAX_UPLOAD_BYTES, type UploadResult as UploadImageResult } from "@/lib/upload-limits";

// Read on the server and passed to the upload fields as a prop, so the client bundle never
// touches `env`. Uploads themselves run in the browser (`blob-upload.ts`) against a client token
// minted by `src/app/admin/upload/route.ts`.
export function isBlobConfigured(): boolean {
	return Boolean(env.BLOB_READ_WRITE_TOKEN);
}
