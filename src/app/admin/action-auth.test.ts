import { readdirSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAdmin: vi.fn(),
	databaseAccess: vi.fn(),
	email: vi.fn(),
	media: vi.fn(),
	cookies: vi.fn(),
	redirect: vi.fn(),
	revalidate: vi.fn(),
	fetch: vi.fn(),
}));
vi.mock("@/lib/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/db", () => ({
	db: new Proxy(
		{},
		{
			get(_target, property) {
				mocks.databaseAccess(property);
				throw new Error("Database was accessed before authorization");
			},
		}
	),
}));
vi.mock("@/lib/email", () => ({
	sendInvitationEmail: mocks.email,
	sendTestEmail: mocks.email,
	renderEmail: mocks.email,
}));
vi.mock("@/lib/media-cleanup", () => ({
	processMediaCleanup: mocks.media,
	queueAbandonedPhotoUploads: mocks.media,
	queuePhotoMediaCleanup: mocks.media,
	queueInvitationMediaCleanup: mocks.media,
}));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import * as dashboard from "@/app/admin/actions";
import * as emails from "@/app/admin/emails/actions";
import * as gifts from "@/app/admin/gifts/actions";
import * as guests from "@/app/admin/guests/actions";
import * as invitations from "@/app/admin/invitations/actions";
import * as memories from "@/app/admin/memories/actions";
import * as pages from "@/app/admin/pages/actions";
import * as settings from "@/app/admin/settings/actions";
import * as site from "@/app/admin/settings/site-actions";

// Enumerating namespace exports includes additions such as previewImport without a hand-maintained
// action name list. The inventory assertion below makes a newly added module require coverage too.
const modules = {
	"actions.ts": dashboard,
	"emails/actions.ts": emails,
	"gifts/actions.ts": gifts,
	"guests/actions.ts": guests,
	"invitations/actions.ts": invitations,
	"memories/actions.ts": memories,
	"pages/actions.ts": pages,
	"settings/actions.ts": settings,
	"settings/site-actions.ts": site,
};
const actions = Object.entries(modules).flatMap(([module, exports]) =>
	Object.entries(exports)
		.filter(([, value]) => typeof value === "function")
		.map(([name, action]) => ({
			label: `${module}:${name}`,
			action: action as (...args: unknown[]) => Promise<unknown>,
		}))
);
function actionFiles(directory: string, prefix = ""): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.isDirectory()) return actionFiles(path.join(directory, entry.name), relative);
		return /(?:^|\/)(?:site-)?actions\.ts$/.test(relative) && relative !== "login/actions.ts"
			? [relative]
			: [];
	});
}

describe("privileged admin Server Action authorization", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", mocks.fetch);
	});
	afterEach(() => {
		vi.unstubAllGlobals();
	});
	it("covers every privileged actions module while leaving login public", () => {
		expect(actionFiles(import.meta.dirname).sort()).toEqual(Object.keys(modules).sort());
		for (const exports of Object.values(modules)) {
			expect(Object.values(exports).some((value) => typeof value === "function")).toBe(true);
		}
	});
	describe.each(["missing", "invalid", "expired"])("%s admin session", () => {
		it.each(actions)(
			"rejects $label before privileged work or reading input",
			async ({ action }) => {
				const denied = new Error("Unauthorized");
				mocks.requireAdmin.mockRejectedValue(denied);
				// Deliberately omit arguments: authentication is the first boundary, even for malformed
				// direct action requests. Touching payload fields or side effects first fails this check.
				await expect(action()).rejects.toBe(denied);
				expect(mocks.requireAdmin).toHaveBeenCalledOnce();
				for (const sideEffect of [
					mocks.databaseAccess,
					mocks.email,
					mocks.media,
					mocks.cookies,
					mocks.redirect,
					mocks.revalidate,
					mocks.fetch,
				]) {
					expect(sideEffect).not.toHaveBeenCalled();
				}
			}
		);
	});
});
