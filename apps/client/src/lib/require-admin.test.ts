import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cookies: vi.fn(), get: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/env", () => ({
	env: {
		ADMIN_SESSION_SECRET: "isolated-auth-test-secret",
		ADMIN_PASSWORD: "isolated-auth-test-password",
	},
}));

import { ADMIN_SESSION_COOKIE, createSessionCookieValue } from "@/lib/admin-session";
import { requireAdmin } from "@/lib/require-admin";

describe("requireAdmin cookie validation", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2027-01-01T12:00:00Z"));
		mocks.cookies.mockResolvedValue({ get: mocks.get });
	});
	afterEach(() => {
		vi.useRealTimers();
	});
	it("rejects a missing session cookie", async () => {
		mocks.get.mockReturnValue(undefined);
		await expect(requireAdmin()).rejects.toThrow("Unauthorized");
		expect(mocks.get).toHaveBeenCalledWith(ADMIN_SESSION_COOKIE);
	});
	it.each([
		"",
		"invalid",
		"9999999999999.forged",
		"NaN.forged",
		"Infinity.forged",
		"999999999999999999999.forged",
	])("rejects malformed or forged session %s", async (value) => {
		mocks.get.mockReturnValue({ value });
		await expect(requireAdmin()).rejects.toThrow("Unauthorized");
	});
	it("rejects an expired correctly signed cookie", async () => {
		const value = createSessionCookieValue();
		vi.setSystemTime(new Date("2027-02-01T12:00:00Z"));
		mocks.get.mockReturnValue({ value });
		await expect(requireAdmin()).rejects.toThrow("Unauthorized");
	});
	it("rejects a cookie exactly at its expiration instant", async () => {
		const value = createSessionCookieValue();
		vi.setSystemTime(Number(value.split(".")[0]));
		mocks.get.mockReturnValue({ value });
		await expect(requireAdmin()).rejects.toThrow("Unauthorized");
	});
	it("rejects a valid signature with appended session fields", async () => {
		mocks.get.mockReturnValue({ value: `${createSessionCookieValue()}.extra` });
		await expect(requireAdmin()).rejects.toThrow("Unauthorized");
	});
	it("rejects a tampered signed expiration", async () => {
		const [expires, signature] = createSessionCookieValue().split(".");
		mocks.get.mockReturnValue({ value: `${Number(expires) + 1}.${signature}` });
		await expect(requireAdmin()).rejects.toThrow("Unauthorized");
	});
	it("accepts a valid unexpired admin session", async () => {
		mocks.get.mockReturnValue({ value: createSessionCookieValue() });
		await expect(requireAdmin()).resolves.toBeUndefined();
		expect(mocks.cookies).toHaveBeenCalledOnce();
		expect(mocks.get).toHaveBeenCalledWith(ADMIN_SESSION_COOKIE);
	});
});
