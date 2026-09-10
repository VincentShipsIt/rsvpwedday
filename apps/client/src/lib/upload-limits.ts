// Client-safe: shared by the browser upload helper and the token route, so it must not import
// `env` (which `blob.ts` does).
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };
