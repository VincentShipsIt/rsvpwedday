import { describe, expect, it } from "vitest";
import {
	isRichTextEmpty,
	normalizeRichText,
	richTextToPlainText,
	sanitizeRichText,
} from "@/domain/rich-text";

describe("sanitizeRichText", () => {
	it("keeps the editor's formatting tags", () => {
		const html =
			"<h3>Title</h3><p>Some <strong>bold</strong> and <em>italic</em></p><ul><li>one</li></ul>";
		expect(sanitizeRichText(html)).toBe(html);
	});

	it("strips scripts, styles and event handlers", () => {
		expect(
			sanitizeRichText('<p style="color:red" onclick="x()">hi</p><script>alert(1)</script>')
		).toBe("<p>hi</p>");
	});

	it("only allows safe link schemes and opens links in a new tab", () => {
		expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).toBe(
			'<a rel="noopener noreferrer" target="_blank">x</a>'
		);
		expect(sanitizeRichText('<a href="https://example.com">x</a>')).toBe(
			'<a href="https://example.com" rel="noopener noreferrer" target="_blank">x</a>'
		);
	});

	it("collapses oversized headings into the two editor sizes", () => {
		expect(sanitizeRichText("<h1>a</h1><h2>b</h2><h5>c</h5>")).toBe(
			"<h3>a</h3><h3>b</h3><h4>c</h4>"
		);
	});
});

describe("normalizeRichText", () => {
	it("turns legacy plain text into paragraphs and line breaks", () => {
		expect(normalizeRichText("First line\nsecond line\n\nSecond paragraph")).toBe(
			"<p>First line<br />second line</p><p>Second paragraph</p>"
		);
	});

	it("escapes angle brackets in legacy plain text that is not markup", () => {
		expect(normalizeRichText("a < b & c")).toBe("<p>a &lt; b &amp; c</p>");
	});

	it("passes editor output through the sanitiser", () => {
		expect(normalizeRichText("<p>hi</p><script>x</script>")).toBe("<p>hi</p>");
	});

	it("returns an empty string for whitespace", () => {
		expect(normalizeRichText("  \n ")).toBe("");
	});
});

describe("richTextToPlainText", () => {
	it("flattens markup to text with paragraph breaks", () => {
		expect(richTextToPlainText("<p>One &amp; two</p><p>Three<br />four</p>")).toBe(
			"One & two\n\nThree\nfour"
		);
	});

	it("treats an empty paragraph as empty", () => {
		expect(isRichTextEmpty("<p></p>")).toBe(true);
		expect(isRichTextEmpty("<p>x</p>")).toBe(false);
	});
});
