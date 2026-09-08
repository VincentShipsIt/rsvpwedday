import { describe, expect, it } from "vitest";
import { createRsvpSubmissionSchema } from "@/domain/rsvp-schema";
import { GuestKind } from "@/generated/prisma/enums";

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

describe("under-12 count and adult companion allowance", () => {
	it("rejects whitespace-only adult contact details", () => {
		expect(
			createRsvpSubmissionSchema(1).safeParse({
				guests: baseGuests,
				companions: [{ firstName: "Fixture", lastName: "Adult", phone: "   " }],
			}).success
		).toBe(false);
	});
	it("trims pasted adult contact details before validating and saving", () => {
		const result = createRsvpSubmissionSchema(1).parse({
			guests: baseGuests,
			companions: [
				{
					firstName: " Fixture ",
					lastName: " Adult ",
					email: "  fixture@example.test  ",
					phone: "  +44123456789  ",
				},
			],
		});
		expect(result.companions[0]).toMatchObject({
			firstName: "Fixture",
			lastName: "Adult",
			email: "fixture@example.test",
			phone: "+44123456789",
		});
	});
	it("accepts children without names, email or phone even when adult companions are disabled", () => {
		expect(
			createRsvpSubmissionSchema(0).safeParse({
				guests: baseGuests,
				companions: [],
				childrenUnder12: 3,
				childrenDietary: "No nuts",
				childAttendance: [{ eventId: "wedding", count: 2 }],
			}).success
		).toBe(true);
	});
	it("keeps the full adult companion allowance separate from the child count", () => {
		expect(
			createRsvpSubmissionSchema(1).safeParse({
				guests: baseGuests,
				companions: [{ firstName: "Fixture", lastName: "Adult", phone: "+44123456789" }],
				childrenUnder12: 4,
				childAttendance: [{ eventId: "wedding", count: 4 }],
			}).success
		).toBe(true);
	});
	it("rejects named children passed as adult companions", () => {
		expect(
			createRsvpSubmissionSchema(1).safeParse({
				guests: baseGuests,
				companions: [
					{
						firstName: "Fixture",
						lastName: "Child",
						kind: GuestKind.CHILD,
						email: "parent@example.test",
					},
				],
			}).success
		).toBe(false);
	});
	it.each([-1, 1.5, 21, "2", null])("rejects invalid child count %s", (childrenUnder12) => {
		expect(
			createRsvpSubmissionSchema(0).safeParse({
				guests: baseGuests,
				companions: [],
				childrenUnder12,
			}).success
		).toBe(false);
	});
	it.each([-1, 1.5, 3])(
		"rejects child event attendance %s outside the household count",
		(count) => {
			expect(
				createRsvpSubmissionSchema(0).safeParse({
					guests: baseGuests,
					companions: [],
					childrenUnder12: 2,
					childAttendance: [{ eventId: "wedding", count }],
				}).success
			).toBe(false);
		}
	);
	it("permits a household consisting only of children to decline every event", () => {
		expect(
			createRsvpSubmissionSchema(0).safeParse({
				guests: [],
				companions: [],
				childrenUnder12: 2,
				childAttendance: [{ eventId: "wedding", count: 0 }],
			}).success
		).toBe(true);
	});
});
