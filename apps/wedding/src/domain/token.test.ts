import { describe, expect, it } from "vitest";
import { newToken } from "@/domain/token";

describe("newToken", () => {
	it("returns a base64url string with no padding or unsafe characters", () => {
		const token = newToken();
		expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
	});

	it("encodes 32 bytes", () => {
		const token = newToken();
		expect(Buffer.from(token, "base64url")).toHaveLength(32);
	});

	it("is unique across calls", () => {
		const tokens = new Set(Array.from({ length: 50 }, () => newToken()));
		expect(tokens.size).toBe(50);
	});
});
