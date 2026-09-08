import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAdmin: vi.fn(),
	renderEmail: vi.fn(),
	sendTestEmail: vi.fn(),
}));
vi.mock("@/lib/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/email", () => ({
	renderEmail: mocks.renderEmail,
	sendTestEmail: mocks.sendTestEmail,
}));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/env", () => ({
	env: { RESEND_API_KEY: "fixture", APP_URL: "https://example.test" },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { renderEmailPreview, sendTestEmailAction } from "@/app/admin/emails/actions";
import { EmailKind, Locale } from "@/generated/prisma/enums";

describe("email draft delivery", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.sendTestEmail.mockResolvedValue({ status: "accepted", resendId: "fixture", error: null });
		mocks.renderEmail.mockResolvedValue({ html: "preview", subject: "subject" });
	});
	it.each(
		Object.values(EmailKind).flatMap((kind) =>
			Object.values(Locale).map((locale) => ({ kind, locale }))
		)
	)("sends exactly the sanitized preview draft for $kind/$locale", async ({ kind, locale }) => {
		const draft = {
			kind,
			locale,
			subject: " Changed subject ",
			heading: " New heading ",
			body: "<p>Latest draft</p><script>alert(1)</script>",
		};
		await renderEmailPreview(draft);
		await sendTestEmailAction({ ...draft, to: "test@example.test" });
		const previewDraft = mocks.renderEmail.mock.calls[0]?.[5];
		const sentDraft = mocks.sendTestEmail.mock.calls[0]?.[3];
		expect(sentDraft).toMatchObject(previewDraft);
		expect(sentDraft.subject).toBe("Changed subject");
		expect(sentDraft.body).not.toContain("script");
	});
	it("rejects direct unauthenticated preview and test operations before rendering or delivery", async () => {
		mocks.requireAdmin.mockRejectedValue(new Error("Unauthorized"));
		const draft = { kind: EmailKind.INVITE, locale: Locale.en, subject: "", heading: "", body: "" };
		await expect(renderEmailPreview(draft)).rejects.toThrow("Unauthorized");
		await expect(sendTestEmailAction({ ...draft, to: "test@example.test" })).rejects.toThrow(
			"Unauthorized"
		);
		expect(mocks.renderEmail).not.toHaveBeenCalled();
		expect(mocks.sendTestEmail).not.toHaveBeenCalled();
	});
});
