// Short connector words dropped before taking initials, so "Anna & Mark" or "Anna and Mark"
// both resolve to "AM" instead of picking up a stray "A" from "and".
const CONNECTOR_WORDS = new Set(["and", "und", "the", "de", "di", "von", "van", "û", "u"]);

export function getInitials(coupleNames: string): string {
	const words = coupleNames
		.split(/[^\p{L}]+/u)
		.map((word) => word.trim())
		.filter((word) => word.length > 0 && !CONNECTOR_WORDS.has(word.toLowerCase()));

	const [first, ...rest] = words;
	if (!first) {
		return "";
	}
	if (rest.length === 0) {
		return first.slice(0, 2).toUpperCase();
	}
	const last = words.at(-1) ?? first;
	return `${first[0]}${last[0]}`.toUpperCase();
}
