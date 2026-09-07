import { upload } from "@vercel/blob/client";
import { MAX_UPLOAD_BYTES, type UploadResult as UploadImageResult } from "@/lib/upload-limits";

const HANDLE_UPLOAD_URL = "/admin/upload";

// Browser-side uploads: the file goes from the guest's browser straight to Blob using a token
// minted by `src/app/admin/upload/route.ts`, so no Server Action body limit applies.
async function uploadFile(file: File, kind: "image" | "audio"): Promise<UploadImageResult> {
	if (file.size > MAX_UPLOAD_BYTES) {
		return {
			ok: false,
			error: `${kind === "audio" ? "Audio files" : "Images"} must be 8 MB or smaller.`,
		};
	}
	try {
		const blob = await upload(file.name, file, {
			access: "public",
			handleUploadUrl: HANDLE_UPLOAD_URL,
			clientPayload: kind,
		});
		return { ok: true, url: blob.url };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Upload failed.";
		return { ok: false, error: message };
	}
}

export function uploadImage(file: File): Promise<UploadImageResult> {
	if (!file.type.startsWith("image/")) {
		return Promise.resolve({ ok: false, error: "Only image files are allowed." });
	}
	return uploadFile(file, "image");
}

// The background-music track. Same store and size cap as photos; a three-minute MP3 at a normal
// bitrate is well under 8 MB, and anything larger would be a slow download for guests anyway.
export function uploadAudio(file: File): Promise<UploadImageResult> {
	if (!file.type.startsWith("audio/")) {
		return Promise.resolve({
			ok: false,
			error: "Only audio files (MP3, M4A, OGG) are allowed.",
		});
	}
	return uploadFile(file, "audio");
}
