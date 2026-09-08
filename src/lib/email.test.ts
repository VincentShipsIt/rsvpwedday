import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	send: vi.fn(),
	logCreate: vi.fn(),
	logUpdate: vi.fn(),
	render: vi.fn(),
	env: {
		RESEND_API_KEY: "fixture",
		EMAIL_FROM: "mail@example.test",
		APP_URL: "https://example.test",
	},
}));
vi.mock("resend", () => ({
	Resend: class {
		emails = { send: mocks.send };
	},
}));
vi.mock("@react-email/components", () => ({ render: mocks.render }));
vi.mock("@/emails/invitation-email", () => ({ InvitationEmail: () => null }));
vi.mock("@/lib/env", () => ({ env: mocks.env }));
vi.mock("@/lib/home-hero", () => ({ getHomeHero: async () => ({ imageUrl: null }) }));
vi.mock("@/lib/db", () => ({
	db: {
		invitation: {
			findUniqueOrThrow: async () => ({
				id: "household",
				email: "guest@example.test",
				locale: "en",
				token: "fixture-token",
				guests: [],
			}),
		},
		settings: {
			findUniqueOrThrow: async () => ({
				coupleNames: "Fixture Couple",
				rsvpDeadline: new Date("2027-06-01T00:00:00Z"),
				timeZone: "UTC",
				replyTo: null,
			}),
		},
		siteContent: { findUnique: async () => null },
		event: { findMany: async () => [] },
		emailTemplate: { findUnique: async () => null },
		emailLog: { create: mocks.logCreate, update: mocks.logUpdate },
	},
}));

import { EmailKind } from "@/generated/prisma/enums";
import { sendInvitationEmail } from "@/lib/email";

describe("provider email delivery", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.env.RESEND_API_KEY = "fixture";
		mocks.render.mockResolvedValue("<html>fixture</html>");
		mocks.logCreate.mockResolvedValue({ id: "attempt" });
		mocks.logUpdate.mockResolvedValue({});
	});
	it("records a no-key simulation without calling the provider", async () => {
		mocks.env.RESEND_API_KEY = "";
		vi.spyOn(console, "info").mockImplementation(() => {});
		expect(await sendInvitationEmail(EmailKind.INVITE, "household")).toMatchObject({
			status: "simulated",
			resendId: null,
		});
		expect(mocks.send).not.toHaveBeenCalled();
		expect(mocks.logCreate).toHaveBeenCalledWith({
			data: { invitationId: "household", kind: "INVITE", error: "Delivery attempt in progress" },
		});
	});
	it("records acceptance only with a provider identifier", async () => {
		mocks.send.mockResolvedValue({ data: { id: "accepted-id" }, error: null });
		expect(await sendInvitationEmail(EmailKind.INVITE, "household")).toMatchObject({
			status: "accepted",
		});
		expect(mocks.logUpdate).toHaveBeenCalledWith({
			where: { id: "attempt" },
			data: { resendId: "accepted-id", error: null },
		});
	});
	it("returns and retains a provider rejection", async () => {
		mocks.send.mockResolvedValue({ data: null, error: { message: "Rate limited" } });
		expect(await sendInvitationEmail(EmailKind.INVITE, "household")).toMatchObject({
			status: "failed",
			error: "Rate limited",
		});
		expect(mocks.logUpdate).toHaveBeenCalledWith({
			where: { id: "attempt" },
			data: { resendId: null, error: "Rate limited" },
		});
	});
	it("records a network exception instead of reporting success", async () => {
		mocks.send.mockRejectedValue(new Error("network"));
		expect(await sendInvitationEmail(EmailKind.INVITE, "household")).toMatchObject({
			status: "failed",
			resendId: null,
		});
		expect(mocks.logUpdate).toHaveBeenCalled();
	});
});
