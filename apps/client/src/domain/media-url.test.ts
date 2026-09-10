import { describe, expect, it } from "vitest";
import { isAllowedMediaUrl } from "@/domain/media-url";

describe("isAllowedMediaUrl", () => {
	it("accepts an https URL with a real hostname", () => {
		expect(isAllowedMediaUrl("https://blob.example.com/song.mp3")).toBe(true);
	});

	it("rejects a value that does not parse as a URL", () => {
		expect(isAllowedMediaUrl("song.mp3")).toBe(false);
	});

	it("rejects http", () => {
		expect(isAllowedMediaUrl("http://blob.example.com/song.mp3")).toBe(false);
	});

	it("rejects localhost", () => {
		expect(isAllowedMediaUrl("https://localhost/song.mp3")).toBe(false);
	});

	it("rejects an IPv4 literal", () => {
		expect(isAllowedMediaUrl("https://10.0.0.1/song.mp3")).toBe(false);
	});

	it("rejects an IPv6 literal", () => {
		expect(isAllowedMediaUrl("https://[::1]/song.mp3")).toBe(false);
	});
});
