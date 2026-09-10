import { upload } from "@vercel/blob/client";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

export async function uploadGuestPhoto(
	file: File,
	token: string,
	receipt: { id: string; pathname: string }
) {
	if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be 8 MB or smaller.");
	await upload(receipt.pathname, file, {
		access: "public",
		handleUploadUrl: `/rsvp/${token}/memories/upload`,
		clientPayload: receipt.id,
	});
}
