import { describe, expect, it } from "vitest";
import { isAllowedImageUrl } from "@/domain/image-url";

describe("isAllowedImageUrl", () => {
	it("accepts an https URL with a real hostname", () => {
		expect(isAllowedImageUrl("https://images.example.com/photo.jpg")).toBe(true);
	});

	it("rejects a value that does not parse as a URL", () => {
		expect(isAllowedImageUrl("not a url")).toBe(false);
	});

	it("rejects http", () => {
		expect(isAllowedImageUrl("http://images.example.com/photo.jpg")).toBe(false);
	});

	it("rejects localhost", () => {
		expect(isAllowedImageUrl("https://localhost/photo.jpg")).toBe(false);
	});

	it("rejects an IPv4 literal", () => {
		expect(isAllowedImageUrl("https://127.0.0.1/photo.jpg")).toBe(false);
	});

	it("rejects an IPv6 literal", () => {
		expect(isAllowedImageUrl("https://[::1]/photo.jpg")).toBe(false);
	});
});
