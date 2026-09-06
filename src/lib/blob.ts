import { env } from "@/lib/env";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export type UploadImageResult = { ok: true; url: string } | { ok: false; error: string };

// Read on the server and passed to the upload fields as a prop, so the client bundle never
// touches `env`. The upload action itself lives in `blob-upload.ts`: a module that exports a
// Server Action has to carry a file-level `"use server"`, and that directive forbids exporting
// anything synchronous, which this predicate is.
export function isBlobConfigured(): boolean {
	return Boolean(env.BLOB_READ_WRITE_TOKEN);
}
