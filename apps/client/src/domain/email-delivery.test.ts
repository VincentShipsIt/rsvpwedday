import { describe, expect, it } from "vitest";
import { emailDeliveryStatus, hasSuccessfulEmail } from "@/domain/email-delivery";

describe("email delivery history", () => {
	it("keeps failed, in-progress and simulated invite attempts eligible for a real retry", () => {
		for (const error of [null, "Rate limited", "Delivery attempt in progress"]) {
			expect(hasSuccessfulEmail([{ kind: "INVITE", resendId: null, error }], "INVITE")).toBe(false);
		}
	});
	it("requires provider acceptance of the requested email kind", () => {
		const logs = [{ kind: "REMINDER", resendId: "provider-id", error: null }];
		expect(hasSuccessfulEmail(logs, "INVITE")).toBe(false);
		expect(hasSuccessfulEmail(logs, "REMINDER")).toBe(true);
	});
	it("preserves successful delivery despite a later failed retry", () => {
		expect(
			hasSuccessfulEmail(
				[
					{ kind: "INVITE", resendId: "provider-id", error: null },
					{ kind: "INVITE", resendId: null, error: "Network failure" },
				],
				"INVITE"
			)
		).toBe(true);
	});
	it("distinguishes legacy simulation, attempts, acceptance and failure", () => {
		expect(emailDeliveryStatus({ resendId: null, error: null })).toBe("simulated");
		expect(emailDeliveryStatus({ resendId: null, error: "Delivery attempt in progress" })).toBe(
			"attempted"
		);
		expect(emailDeliveryStatus({ resendId: "id", error: null })).toBe("accepted");
		expect(emailDeliveryStatus({ resendId: null, error: "invalid recipient" })).toBe("failed");
	});
});
