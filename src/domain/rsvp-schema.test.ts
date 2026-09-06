import { describe, expect, it } from "vitest";
import { createRsvpSubmissionSchema } from "@/domain/rsvp-schema";
import { GuestKind } from "@/generated/prisma/client";

const baseGuests = [
	{ guestId: "g1", dietary: "", attendance: [{ eventId: "wedding", attending: true }] },
];

describe("createRsvpSubmissionSchema", () => {
	it("accepts a submission within the companion allowance", () => {
		const schema = createRsvpSubmissionSchema(1);
		const result = schema.safeParse({
			guests: baseGuests,
			companions: [
				{ firstName: "Max", lastName: "Muster", kind: GuestKind.ADULT, email: "max@example.com" },
			],
			note: "",
			songRequest: "",
		});
		expect(result.success).toBe(true);
	});

	it("rejects more companions than the allowance", () => {
		const schema = createRsvpSubmissionSchema(0);
		const result = schema.safeParse({
			guests: baseGuests,
			companions: [
				{ firstName: "Max", lastName: "Muster", kind: GuestKind.ADULT, email: "max@example.com" },
			],
		});
		expect(result.success).toBe(false);
	});

	it("rejects a companion with neither email nor phone", () => {
		const schema = createRsvpSubmissionSchema(1);
		const result = schema.safeParse({
			guests: baseGuests,
			companions: [{ firstName: "Max", lastName: "Muster", kind: GuestKind.ADULT }],
		});
		expect(result.success).toBe(false);
	});

	it("accepts a companion with only a phone number", () => {
		const schema = createRsvpSubmissionSchema(1);
		const result = schema.safeParse({
			guests: baseGuests,
			companions: [
				{ firstName: "Max", lastName: "Muster", kind: GuestKind.ADULT, phone: "+41791234567" },
			],
		});
		expect(result.success).toBe(true);
	});

	it("requires at least one guest", () => {
		const schema = createRsvpSubmissionSchema(0);
		const result = schema.safeParse({ guests: [], companions: [] });
		expect(result.success).toBe(false);
	});
});
