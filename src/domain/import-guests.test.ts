import { describe, expect, it } from "vitest";
import {
	type ExistingImportGuest,
	eventImportImpact,
	planGuestImport,
} from "@/domain/import-guests";
import { Attendance, GuestKind } from "@/generated/prisma/enums";

const jane: ExistingImportGuest = {
	id: "jane",
	firstName: "Jane",
	lastName: "Doe",
	kind: GuestKind.ADULT,
	email: "jane@example.com",
	phone: "+41 79",
	addedByGuest: false,
	attendance: [{ eventId: "ceremony", status: Attendance.ACCEPTED }],
};
const incoming = {
	firstName: "Jane",
	lastName: "Doe",
	kind: GuestKind.ADULT,
	email: null,
	phone: null,
};

describe("non-destructive guest identity merge", () => {
	it("matches a legacy template without replacing guests or blanking their contacts", () => {
		expect(planGuestImport([incoming], [jane])).toEqual({
			ok: true,
			plan: { updates: [], creates: [], retained: 0, unchanged: 1 },
		});
	});
	it("corrects a name with its guest ID and emits only editable fields", () => {
		const result = planGuestImport([{ ...incoming, id: jane.id, firstName: "Janet" }], [jane]);
		expect(result).toEqual({
			ok: true,
			plan: {
				updates: [
					{
						id: "jane",
						data: { ...incoming, firstName: "Janet", email: jane.email, phone: jane.phone },
					},
				],
				creates: [],
				retained: 0,
				unchanged: 0,
			},
		});
		expect(jane.attendance[0].status).toBe(Attendance.ACCEPTED);
	});
	it("uses an unambiguous contact for legacy name corrections", () => {
		const result = planGuestImport(
			[{ ...incoming, firstName: "Janet", phone: "+41 (79)" }],
			[jane]
		);
		expect(result.ok && result.plan.updates[0].id).toBe(jane.id);
	});
	it("preserves omitted guests, companions and legacy named children", () => {
		const result = planGuestImport(
			[incoming],
			[
				jane,
				{ ...jane, id: "companion", firstName: "Sam", addedByGuest: true },
				{ ...jane, id: "child", firstName: "Junior", kind: GuestKind.CHILD },
			]
		);
		expect(result.ok && result.plan.retained).toBe(2);
		expect(result.ok && result.plan.creates).toEqual([]);
	});
	it("rejects unknown, foreign and duplicated explicit identities", () => {
		expect(planGuestImport([{ ...incoming, id: "foreign-id" }], [jane]).ok).toBe(false);
		expect(planGuestImport([{ ...incoming, id: "unknown-id" }], []).ok).toBe(false);
		expect(
			planGuestImport(
				[
					{ ...incoming, id: jane.id },
					{ ...incoming, id: jane.id },
				],
				[jane]
			).ok
		).toBe(false);
	});
	it("rejects ambiguous names, shared contacts, duplicates and uncertain renamed guests", () => {
		expect(planGuestImport([incoming], [jane, { ...jane, id: "other" }]).ok).toBe(false);
		expect(
			planGuestImport(
				[{ ...incoming, firstName: "Janet", email: jane.email }],
				[jane, { ...jane, id: "other", firstName: "Sam" }]
			).ok
		).toBe(false);
		expect(planGuestImport([incoming, incoming], []).ok).toBe(false);
		expect(planGuestImport([{ ...incoming, firstName: "Janet" }], [jane]).ok).toBe(false);
	});
	it("adds new people when existing organizer guests are already identified", () => {
		const result = planGuestImport([incoming, { ...incoming, firstName: "Sam" }], [jane]);
		expect(result.ok && result.plan.creates).toHaveLength(1);
	});
});

describe("event membership import review", () => {
	it("counts removed responses for every household member and flags newly invited events", () => {
		expect(
			eventImportImpact([jane, { ...jane, id: "companion", addedByGuest: true }], ["brunch"])
		).toEqual({ removedMemberships: 2, removedResponses: 2, needsReply: true });
		expect(eventImportImpact([jane], ["ceremony"])).toEqual({
			removedMemberships: 0,
			removedResponses: 0,
			needsReply: false,
		});
	});
});
