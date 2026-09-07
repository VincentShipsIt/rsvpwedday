import type { IllustrationSubject } from "@/domain/illustration-prompt";
import type { UploadResult as GenerateIllustrationResult } from "@/lib/upload-limits";

export type { GenerateIllustrationResult };

const GENERATE_URL = "/admin/generate-image";

// Browser side of `src/app/admin/generate-image/route.ts`: it returns the same `{ ok, url }`
// shape as an upload, so an image field can hand either straight to `onChange`.
export async function generateIllustration(
	subject: IllustrationSubject
): Promise<GenerateIllustrationResult> {
	try {
		const response = await fetch(GENERATE_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(subject),
		});
		const payload = (await response.json()) as { url?: string; error?: string };
		if (!response.ok || !payload.url) {
			return { ok: false, error: payload.error ?? "Could not generate an image." };
		}
		return { ok: true, url: payload.url };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Could not generate an image.";
		return { ok: false, error: message };
	}
}
