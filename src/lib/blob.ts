import { put } from "@vercel/blob";
import { env } from "@/lib/env";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export type UploadImageResult = { ok: true; url: string } | { ok: false; error: string };

// A plain (non-async) export can't live in a file-level `"use server"` module, so `uploadImage`
// below carries its own inline directive instead.
export function isBlobConfigured(): boolean {
	return Boolean(env.BLOB_READ_WRITE_TOKEN);
}

export async function uploadImage(formData: FormData): Promise<UploadImageResult> {
	"use server";

	if (!isBlobConfigured()) {
		return { ok: false, error: "Photo uploads need a Blob store (BLOB_READ_WRITE_TOKEN)." };
	}

	const file = formData.get("file");
	if (!(file instanceof File)) {
		return { ok: false, error: "No file was uploaded." };
	}

	if (!file.type.startsWith("image/")) {
		return { ok: false, error: "Only image files are allowed." };
	}

	if (file.size > MAX_UPLOAD_BYTES) {
		return { ok: false, error: "Images must be 8 MB or smaller." };
	}

	const blob = await put(file.name, file, {
		access: "public",
		addRandomSuffix: true,
		token: env.BLOB_READ_WRITE_TOKEN,
	});

	return { ok: true, url: blob.url };
}
