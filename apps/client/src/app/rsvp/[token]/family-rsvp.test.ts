import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	transaction: vi.fn(),
	findInvitation: vi.fn(),
	findSettings: vi.fn(),
	guestUpdate: vi.fn(),
	guestCreate: vi.fn(),
	guestDelete: vi.fn(),
	attendanceUpdate: vi.fn(),
	attendanceUpsert: vi.fn(),
	attendanceDelete: vi.fn(),
	childrenDelete: vi.fn(),
	childrenCreate: vi.fn(),
	invitationUpdate: vi.fn(),
	sendEmail: vi.fn(),
	revalidatePath: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: { $transaction: mocks.transaction } }));
vi.mock("@/lib/email", () => ({ sendInvitationEmail: mocks.sendEmail }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { submitRsvp } from "@/app/rsvp/[token]/actions";
import { Attendance, GuestKind } from "@/generated/prisma/enums";

const tx = {
	invitation: { findUnique: mocks.findInvitation, update: mocks.invitationUpdate },
	settings: { findUniqueOrThrow: mocks.findSettings },
	guest: { update: mocks.guestUpdate, create: mocks.guestCreate, deleteMany: mocks.guestDelete },
	eventAttendance: {
		update: mocks.attendanceUpdate,
		upsert: mocks.attendanceUpsert,
		deleteMany: mocks.attendanceDelete,
	},
	invitationChildAttendance: { deleteMany: mocks.childrenDelete, createMany: mocks.childrenCreate },
};
const mutations = [
	mocks.guestUpdate,
	mocks.guestCreate,
	mocks.guestDelete,
	mocks.attendanceUpdate,
	mocks.attendanceUpsert,
	mocks.attendanceDelete,
	mocks.childrenDelete,
	mocks.childrenCreate,
	mocks.invitationUpdate,
];
function invitation() {
	return {
		id: "household-a",
		token: "valid-token",
		locale: "en",
		companionAllowance: 1,
		childrenUnder12: null,
		guests: [
			{
				id: "adult-a",
				kind: GuestKind.ADULT,
				addedByGuest: false,
				attendance: [{ eventId: "ceremony" }, { eventId: "brunch" }],
			},
			{
				id: "adult-b",
				kind: GuestKind.ADULT,
				addedByGuest: false,
				attendance: [{ eventId: "ceremony" }],
			},
			{
				id: "legacy-child",
				kind: GuestKind.CHILD,
				addedByGuest: false,
				attendance: [{ eventId: "ceremony" }],
			},
			{
				id: "retained-companion",
				kind: GuestKind.ADULT,
				addedByGuest: true,
				attendance: [{ eventId: "ceremony" }, { eventId: "brunch" }],
			},
		],
	};
}
function payload() {
	return {
		guests: [
			{
				guestId: "adult-a",
				dietary: "Vegetarian",
				attendance: [
					{ eventId: "ceremony", attending: true },
					{ eventId: "brunch", attending: false },
				],
			},
			{ guestId: "adult-b", dietary: "", attendance: [{ eventId: "ceremony", attending: false }] },
		],
		companions: [
			{
				id: "retained-companion",
				firstName: "Fixture",
				lastName: "Adult",
				kind: GuestKind.ADULT,
				email: "fixture@example.test",
				attendance: [
					{ eventId: "ceremony", attending: false },
					{ eventId: "brunch", attending: true },
				],
			},
		],
		childrenUnder12: 3,
		childrenDietary: "No nuts",
		childAttendance: [
			{ eventId: "ceremony", count: 3 },
			{ eventId: "brunch", count: 1 },
		],
		note: "Fixture note",
		songRequest: "Fixture song",
	};
}
function expectNoWrites() {
	for (const mutation of mutations) expect(mutation).not.toHaveBeenCalled();
	expect(mocks.sendEmail).not.toHaveBeenCalled();
}

describe("family RSVP transaction", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.findInvitation.mockResolvedValue(invitation());
		mocks.findSettings.mockResolvedValue({ rsvpDeadline: new Date("2099-01-01T00:00:00Z") });
		mocks.transaction.mockImplementation(async (callback) => callback(tx));
		mocks.guestUpdate.mockImplementation(async ({ where }) => ({ id: where.id }));
		mocks.guestCreate.mockResolvedValue({ id: "new-companion" });
		mocks.sendEmail.mockResolvedValue({ status: "accepted", resendId: "fixture", error: null });
	});
	it("saves each adult, companion and child count independently in a serializable transaction", async () => {
		expect(await submitRsvp("valid-token", payload())).toEqual({ ok: true });
		expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
			isolationLevel: "Serializable",
		});
		expect(mocks.findInvitation).toHaveBeenCalledWith({
			where: { token: "valid-token" },
			include: { guests: { where: { deletedAt: null }, include: { attendance: true } } },
		});
		expect(mocks.attendanceUpdate).toHaveBeenCalledWith({
			where: { guestId_eventId: { guestId: "adult-b", eventId: "ceremony" } },
			data: { status: Attendance.DECLINED },
		});
		expect(mocks.attendanceUpsert).toHaveBeenCalledWith({
			where: { guestId_eventId: { guestId: "retained-companion", eventId: "brunch" } },
			create: { guestId: "retained-companion", eventId: "brunch", status: Attendance.ACCEPTED },
			update: { status: Attendance.ACCEPTED },
		});
		expect(mocks.childrenCreate).toHaveBeenCalledWith({
			data: [
				{ invitationId: "household-a", eventId: "ceremony", count: 3 },
				{ invitationId: "household-a", eventId: "brunch", count: 1 },
			],
		});
		expect(mocks.invitationUpdate).toHaveBeenCalledWith({
			where: { id: "household-a" },
			data: {
				childrenUnder12: 3,
				childrenDietary: "No nuts",
				note: "Fixture note",
				songRequest: "Fixture song",
				respondedAt: expect.any(Date),
			},
		});
		expect(mocks.guestDelete).toHaveBeenCalledWith({
			where: {
				invitationId: "household-a",
				addedByGuest: true,
				kind: GuestKind.ADULT,
				id: { notIn: ["retained-companion"] },
			},
		});
		expect(mocks.guestCreate).not.toHaveBeenCalled();
		expect(mocks.guestUpdate.mock.calls.every(([arg]) => arg.where.id !== "legacy-child")).toBe(
			true
		);
		expect(mocks.sendEmail).toHaveBeenCalledWith("CONFIRMATION", "household-a");
	});
	it("creates only a named adult companion and uses the household answers for older clients", async () => {
		const input = {
			...payload(),
			companions: [{ firstName: "New", lastName: "Adult", phone: "+44123456789" }],
		};
		expect(await submitRsvp("valid-token", input)).toEqual({ ok: true });
		expect(mocks.guestCreate).toHaveBeenCalledWith({
			data: {
				firstName: "New",
				lastName: "Adult",
				kind: GuestKind.ADULT,
				email: null,
				phone: "+44123456789",
				invitationId: "household-a",
				addedByGuest: true,
			},
		});
		expect(mocks.attendanceUpsert).toHaveBeenCalledWith({
			where: { guestId_eventId: { guestId: "new-companion", eventId: "ceremony" } },
			create: { guestId: "new-companion", eventId: "ceremony", status: Attendance.ACCEPTED },
			update: { status: Attendance.ACCEPTED },
		});
		expect(mocks.attendanceUpsert).toHaveBeenCalledWith({
			where: { guestId_eventId: { guestId: "new-companion", eventId: "brunch" } },
			create: { guestId: "new-companion", eventId: "brunch", status: Attendance.DECLINED },
			update: { status: Attendance.DECLINED },
		});
	});

	it("accepts children with no contact fields and no adult plus-one allowance", async () => {
		mocks.findInvitation.mockResolvedValue({ ...invitation(), companionAllowance: 0 });
		const input = payload();
		input.companions = [];
		expect(await submitRsvp("valid-token", input)).toEqual({ ok: true });
		expect(mocks.childrenCreate).toHaveBeenCalled();
		expect(mocks.guestCreate).not.toHaveBeenCalled();
	});
	it("removes a retained adult companion while keeping legacy child rows intact", async () => {
		const input = payload();
		input.companions = [];
		input.childrenUnder12 = 0;
		input.childAttendance = [];
		expect(await submitRsvp("valid-token", input)).toEqual({ ok: true });
		expect(mocks.guestDelete).toHaveBeenCalledWith({
			where: {
				invitationId: "household-a",
				addedByGuest: true,
				kind: GuestKind.ADULT,
				id: { notIn: [] },
			},
		});
		expect(mocks.childrenDelete).toHaveBeenCalledWith({ where: { invitationId: "household-a" } });
		expect(mocks.childrenCreate).not.toHaveBeenCalled();
	});
	it("rejects an unknown token without any writes", async () => {
		mocks.findInvitation.mockResolvedValue(null);
		expect(await submitRsvp("unknown", payload())).toMatchObject({ ok: false });
		expectNoWrites();
		expect(mocks.findSettings).not.toHaveBeenCalled();
	});
	it("rejects a closed RSVP before modifying any household data", async () => {
		mocks.findSettings.mockResolvedValue({ rsvpDeadline: new Date("2000-01-01T00:00:00Z") });
		expect(await submitRsvp("valid-token", payload())).toMatchObject({ ok: false });
		expectNoWrites();
	});
	it.each([
		"foreign-guest",
		"duplicate-guest",
		"missing-guest",
		"uninvited-event",
		"duplicate-event",
		"foreign-companion",
		"duplicate-companion",
		"child-uninvited-event",
		"child-duplicate-event",
		"child-over-total",
		"adult-over-allowance",
	])("rejects %s before the first mutation", async (variant) => {
		const input = payload();
		if (variant === "foreign-guest") input.guests[0].guestId = "other-household-adult";
		if (variant === "duplicate-guest") input.guests[1] = input.guests[0];
		if (variant === "missing-guest") input.guests.pop();
		if (variant === "uninvited-event") input.guests[1].attendance[0].eventId = "brunch";
		if (variant === "duplicate-event") input.guests[0].attendance[1].eventId = "ceremony";
		if (variant === "foreign-companion") input.companions[0].id = "other-household-companion";
		if (variant === "duplicate-companion") {
			mocks.findInvitation.mockResolvedValue({ ...invitation(), companionAllowance: 2 });
			input.companions.push(input.companions[0]);
		}
		if (variant === "child-uninvited-event") input.childAttendance[0].eventId = "private-dinner";
		if (variant === "child-duplicate-event") input.childAttendance[1].eventId = "ceremony";
		if (variant === "child-over-total") input.childAttendance[0].count = 4;
		if (variant === "adult-over-allowance")
			mocks.findInvitation.mockResolvedValue({ ...invitation(), companionAllowance: 0 });
		expect(await submitRsvp("valid-token", input)).toMatchObject({ ok: false });
		expectNoWrites();
	});
	it("returns a conflict without sending confirmation when the transaction is rejected", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		mocks.transaction.mockRejectedValue(
			Object.assign(new Error("Serialization conflict"), { code: "P2034" })
		);
		expect(await submitRsvp("valid-token", payload())).toMatchObject({ ok: false });
		expectNoWrites();
	});
	it("keeps a committed RSVP successful when confirmation delivery fails", async () => {
		mocks.sendEmail.mockResolvedValue({ status: "failed", resendId: null, error: "Rate limited" });
		expect(await submitRsvp("valid-token", payload())).toEqual({ ok: true });
		expect(mocks.invitationUpdate).toHaveBeenCalled();
	});
});
