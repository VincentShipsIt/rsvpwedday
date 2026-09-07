import { normalizeRichText } from "@/domain/rich-text";
import { cn } from "@/lib/utils";

// Renders admin-authored copy. `normalizeRichText` sanitises editor output and upgrades legacy
// plain text, so this is the only place the site ever sets HTML from the database.
export function RichText({ html, className }: { html: string; className?: string }) {
	const normalized = normalizeRichText(html);
	if (normalized === "") {
		return null;
	}
	return (
		<div
			className={cn("rich-text", className)}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitised by normalizeRichText
			dangerouslySetInnerHTML={{ __html: normalized }}
		/>
	);
}
