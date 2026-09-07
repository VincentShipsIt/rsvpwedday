"use server";

import { put } from "@vercel/blob";
import { isBlobConfigured, MAX_UPLOAD_BYTES, type UploadImageResult } from "@/lib/blob";
import { env } from "@/lib/env";

export async function uploadImage(formData: FormData): Promise<UploadImageResult> {
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

// The background-music track. Same store and size cap as photos; a three-minute MP3 at a normal
// bitrate is well under 8 MB, and anything larger would be a slow download for guests anyway.
export async function uploadAudio(formData: FormData): Promise<UploadImageResult> {
	if (!isBlobConfigured()) {
		return { ok: false, error: "Music uploads need a Blob store (BLOB_READ_WRITE_TOKEN)." };
	}

	const file = formData.get("file");
	if (!(file instanceof File)) {
		return { ok: false, error: "No file was uploaded." };
	}

	if (!file.type.startsWith("audio/")) {
		return { ok: false, error: "Only audio files (MP3, M4A, OGG) are allowed." };
	}

	if (file.size > MAX_UPLOAD_BYTES) {
		return { ok: false, error: "Audio files must be 8 MB or smaller." };
	}

	const blob = await put(file.name, file, {
		access: "public",
		addRandomSuffix: true,
		token: env.BLOB_READ_WRITE_TOKEN,
	});

	return { ok: true, url: blob.url };
}
