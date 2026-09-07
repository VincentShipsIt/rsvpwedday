import sanitizeHtml from "sanitize-html";

/*
 * Guest-facing copy the couple edits in the admin (story intro, milestone bodies, event
 * descriptions, RSVP note) is stored as a small HTML subset produced by the admin's editor.
 * Everything here is the single allow-list for that subset: the server sanitises on save and
 * again on render, so a value that reached the database by any other route still cannot carry
 * a script or an inline style onto the public site.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
	allowedTags: [
		"p",
		"br",
		"strong",
		"em",
		"u",
		"s",
		"h3",
		"h4",
		"ul",
		"ol",
		"li",
		"a",
		"blockquote",
	],
	allowedAttributes: { a: ["href", "rel", "target"] },
	allowedSchemes: ["https", "http", "mailto"],
	transformTags: {
		b: "strong",
		i: "em",
		// The editor only offers two heading sizes; anything larger would compete with the section
		// heading above it, so deeper levels collapse into those two.
		h1: "h3",
		h2: "h3",
		h5: "h4",
		h6: "h4",
		a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
	},
};

export function sanitizeRichText(html: string): string {
	return sanitizeHtml(html, SANITIZE_OPTIONS).trim();
}

const TAG_PATTERN = /<[a-z][^>]*>/i;

function escapeHtml(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

/*
 * Copy saved before the editor existed is plain text with newlines. Rather than migrating rows,
 * it is upgraded on read: blank lines become paragraphs and single newlines become line breaks,
 * which is what the author meant when they typed them into the old textarea. Text that already
 * contains a tag is treated as editor output and only sanitised.
 */
export function normalizeRichText(value: string): string {
	const trimmed = value.trim();
	if (trimmed === "") {
		return "";
	}
	if (TAG_PATTERN.test(trimmed)) {
		return sanitizeRichText(trimmed);
	}
	return trimmed
		.split(/\n\s*\n/)
		.map((paragraph) => `<p>${escapeHtml(paragraph.trim()).replaceAll("\n", "<br />")}</p>`)
		.join("");
}

// Plain-text projection for places that cannot show markup: calendar files, email previews,
// and the "is there anything here" checks that decide whether a section renders at all.
export function richTextToPlainText(value: string): string {
	const html = normalizeRichText(value)
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/li>/gi, "\n")
		.replace(/<\/(p|h3|h4|blockquote)>/gi, "\n\n");
	return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
		.replaceAll("&amp;", "&")
		.replaceAll("&lt;", "<")
		.replaceAll("&gt;", ">")
		.replaceAll("&quot;", '"')
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

export function isRichTextEmpty(value: string): boolean {
	return richTextToPlainText(value) === "";
}
