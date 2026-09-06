import { describe, expect, it } from "vitest";
import { canRespond, getInvitationStatus } from "@/domain/invitation";
import { Attendance } from "@/generated/prisma/client";

describe("getInvitationStatus", () => {
	it("is pending when the invitation has not responded", () => {
		expect(getInvitationStatus({ respondedAt: null, guests: [] })).toBe("pending");
	});

	it("is declined when responded and no guest accepted any event", () => {
		const status = getInvitationStatus({
			respondedAt: new Date(),
			guests: [
				{ attendance: [{ status: Attendance.DECLINED }] },
				{ attendance: [{ status: Attendance.PENDING }] },
			],
		});
		expect(status).toBe("declined");
	});

	it("is accepted when responded and at least one guest accepted one event", () => {
		const status = getInvitationStatus({
			respondedAt: new Date(),
			guests: [
				{ attendance: [{ status: Attendance.DECLINED }] },
				{ attendance: [{ status: Attendance.ACCEPTED }, { status: Attendance.DECLINED }] },
			],
		});
		expect(status).toBe("accepted");
	});

	it("is accepted even when respondedAt is set but no guests exist yet", () => {
		expect(getInvitationStatus({ respondedAt: new Date(), guests: [] })).toBe("declined");
	});
});

describe("canRespond", () => {
	it("is true before the deadline", () => {
		const deadline = new Date("2026-01-01T00:00:00.000Z");
		const now = new Date("2025-12-31T00:00:00.000Z");
		expect(canRespond(now, deadline)).toBe(true);
	});

	it("is true exactly at the deadline", () => {
		const deadline = new Date("2026-01-01T00:00:00.000Z");
		expect(canRespond(deadline, deadline)).toBe(true);
	});

	it("is false after the deadline", () => {
		const deadline = new Date("2026-01-01T00:00:00.000Z");
		const now = new Date("2026-01-02T00:00:00.000Z");
		expect(canRespond(now, deadline)).toBe(false);
	});
});
