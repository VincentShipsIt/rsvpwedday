import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export const ADMIN_SESSION_COOKIE = "admin_session";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000;

function sha256(value: string): Buffer {
	return createHash("sha256").update(value).digest();
}

function sign(expiresAtMs: string): string {
	return createHmac("sha256", env.ADMIN_SESSION_SECRET).update(expiresAtMs).digest("hex");
}

export function isPasswordValid(password: string): boolean {
	const provided = sha256(password);
	const expected = sha256(env.ADMIN_PASSWORD);
	return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export function createSessionCookieValue(): string {
	const expiresAtMs = String(Date.now() + SESSION_DURATION_MS);
	return `${expiresAtMs}.${sign(expiresAtMs)}`;
}

export function isSessionValid(cookieValue: string | undefined): boolean {
	if (!cookieValue) {
		return false;
	}

	const [expiresAtMs, signature, extra] = cookieValue.split(".");
	if (!expiresAtMs || !signature || extra !== undefined || !/^\d+$/.test(expiresAtMs)) {
		return false;
	}
	if (!Number.isSafeInteger(Number(expiresAtMs)) || Number(expiresAtMs) <= Date.now()) {
		return false;
	}

	const provided = Buffer.from(signature);
	const expected = Buffer.from(sign(expiresAtMs));
	return provided.length === expected.length && timingSafeEqual(provided, expected);
}
