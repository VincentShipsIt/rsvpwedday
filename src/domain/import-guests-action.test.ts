import { beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => {
	type Row = { eventId: string; status: "ACCEPTED" | "DECLINED" | "PENDING" };
	type Guest = {
		id: string;
		invitationId: string;
		firstName: string;
		lastName: string;
		kind: "ADULT" | "CHILD";
		email: string | null;
		phone: string | null;
		dietary: string;
		addedByGuest: boolean;
		attendance: Row[];
	};
	const household = {
		id: "household",
		email: "family@example.com",
		locale: "en",
		companionAllowance: 1,
		childrenUnder12: 2 as number | null,
		childrenDietary: "No nuts",
		respondedAt: new Date("2026-09-08T12:00:00Z") as Date | null,
		note: "Looking forward",
		songRequest: "Our song",
		token: "private-token",
		guests: [] as Guest[],
		childAttendance: [] as { eventId: string; count: number }[],
	};
	const getGuest = (id: string) => {
		const guest = household.guests.find((row) => row.id === id);
		if (!guest) throw new Error("Missing fixture guest");
		return guest;
	};
	const tx = {
		event: {
			findMany: vi.fn(async () => [
				{ id: "ceremony", slug: "ceremony" },
				{ id: "brunch", slug: "brunch" },
			]),
		},
		invitation: {
			findMany: vi.fn(async () => [structuredClone(household)]),
			findUniqueOrThrow: vi.fn(async () => structuredClone(household)),
			update: vi.fn(async ({ data }: { data: Partial<typeof household> }) => {
				Object.assign(household, data);
			}),
			create: vi.fn(),
		},
		guest: {
			update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<Guest> }) => {
				Object.assign(getGuest(where.id), data);
			}),
			create: vi.fn(
				async ({
					data,
				}: {
					data: Omit<Guest, "id" | "attendance" | "dietary" | "addedByGuest">;
				}) => {
					household.guests.push({
						...data,
						id: "new-guest",
						attendance: [],
						dietary: "",
						addedByGuest: false,
					});
				}
			),
		},
		eventAttendance: {
			deleteMany: vi.fn(
				async ({ where }: { where: { guestId: string; eventId: { notIn: string[] } } }) => {
					const guest = getGuest(where.guestId);
					guest.attendance = guest.attendance.filter((row) =>
						where.eventId.notIn.includes(row.eventId)
					);
				}
			),
			upsert: vi.fn(async ({ create }: { create: { guestId: string; eventId: string } }) => {
				const guest = getGuest(create.guestId);
				if (!guest.attendance.some((row) => row.eventId === create.eventId))
					guest.attendance.push({ eventId: create.eventId, status: "PENDING" });
			}),
		},
		invitationChildAttendance: {
			deleteMany: vi.fn(async ({ where }: { where: { eventId: { notIn: string[] } } }) => {
				household.childAttendance = household.childAttendance.filter((row) =>
					where.eventId.notIn.includes(row.eventId)
				);
			}),
			upsert: vi.fn(
				async ({
					create,
					update,
				}: {
					create: { eventId: string; count: number };
					update: { count: number };
				}) => {
					const row = household.childAttendance.find((item) => item.eventId === create.eventId);
					if (row) row.count = update.count;
					else household.childAttendance.push({ eventId: create.eventId, count: create.count });
				}
			),
		},
	};
	return { household, tx, requireAdmin: vi.fn() };
});
vi.mock("@/lib/require-admin", () => ({ requireAdmin: fixture.requireAdmin }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({
	db: { $transaction: (run: (tx: typeof fixture.tx) => unknown) => run(fixture.tx) },
}));

import { commitImport, reviewImport } from "@/app/admin/guests/actions";
import { EDITABLE_IMPORT_CSV_HEADER, IMPORT_CSV_HEADER } from "@/domain/csv";

beforeEach(() => {
	vi.clearAllMocks();
	Object.assign(fixture.household, {
		childrenUnder12: 2,
		respondedAt: new Date("2026-09-08T12:00:00Z"),
		note: "Looking forward",
		songRequest: "Our song",
		childAttendance: [
			{ eventId: "ceremony", count: 2 },
			{ eventId: "brunch", count: 1 },
		],
	});
	fixture.household.guests = [
		{
			id: "jane",
			invitationId: "household",
			firstName: "Jane",
			lastName: "Doe",
			kind: "ADULT",
			email: "jane@example.com",
			phone: "+41 79",
			dietary: "Vegetarian",
			addedByGuest: false,
			attendance: [
				{ eventId: "ceremony", status: "ACCEPTED" },
				{ eventId: "brunch", status: "DECLINED" },
			],
		},
		{
			id: "sam",
			invitationId: "household",
			firstName: "Sam",
			lastName: "Doe",
			kind: "ADULT",
			email: "sam@example.com",
			phone: null,
			dietary: "No dairy",
			addedByGuest: true,
			attendance: [
				{ eventId: "ceremony", status: "ACCEPTED" },
				{ eventId: "brunch", status: "ACCEPTED" },
			],
		},
	];
});
const legacy = `${IMPORT_CSV_HEADER.join(",")}\nfamily@example.com,en,1,Jane,Doe,ADULT,,,ceremony;brunch`;

async function importReviewed(text: string) {
	const review = await reviewImport(text);
	if (!review.ok) throw new Error(review.error);
	return { review, result: await commitImport(text, review.fingerprint) };
}

describe("reviewed CSV merge persistence", () => {
	it("keeps IDs, replies, dietary data, omitted companions and children through repeated imports", async () => {
		const before = structuredClone(fixture.household);
		expect((await importReviewed(legacy)).result.ok).toBe(true);
		expect((await importReviewed(legacy)).result.ok).toBe(true);
		expect(fixture.household).toEqual(before);
		expect(fixture.tx.guest.create).not.toHaveBeenCalled();
		expect(fixture.tx.guest.update).not.toHaveBeenCalled();
	});
	it("renames the selected guest without losing RSVP details", async () => {
		const text = `${EDITABLE_IMPORT_CSV_HEADER.join(",")}\nfamily@example.com,en,1,Janet,Doe,ADULT,,,ceremony;brunch,jane,`;
		expect((await importReviewed(text)).result.ok).toBe(true);
		expect(fixture.household.guests[0]).toMatchObject({
			id: "jane",
			firstName: "Janet",
			dietary: "Vegetarian",
			attendance: [
				{ eventId: "ceremony", status: "ACCEPTED" },
				{ eventId: "brunch", status: "DECLINED" },
			],
		});
		expect(fixture.household.respondedAt).not.toBeNull();
	});
	it("discloses removed responses and synchronizes companions and child attendance", async () => {
		const { review, result } = await importReviewed(legacy.replace("ceremony;brunch", "ceremony"));
		expect(review.summary).toMatchObject({
			removedMemberships: 2,
			removedResponses: 2,
			removedChildAttendance: 1,
		});
		expect(result.ok).toBe(true);
		for (const guest of fixture.household.guests)
			expect(guest.attendance).toEqual([{ eventId: "ceremony", status: "ACCEPTED" }]);
		expect(fixture.household.childAttendance).toEqual([{ eventId: "ceremony", count: 2 }]);
	});
	it("rejects stale review after a guest changes a reply, without writes", async () => {
		const review = await reviewImport(legacy);
		if (!review.ok) throw new Error(review.error);
		fixture.household.guests[0].dietary = "Updated by guest";
		expect((await commitImport(legacy, review.fingerprint)).ok).toBe(false);
		expect(fixture.tx.invitation.update).not.toHaveBeenCalled();
		expect(fixture.tx.eventAttendance.deleteMany).not.toHaveBeenCalled();
	});
	it("preserves legacy child answers when an explicit count converts the household", async () => {
		fixture.household.childrenUnder12 = null;
		fixture.household.childAttendance = [];
		fixture.household.guests.push({
			...fixture.household.guests[0],
			id: "child",
			firstName: "Junior",
			kind: "CHILD",
			attendance: [
				{ eventId: "ceremony", status: "ACCEPTED" },
				{ eventId: "brunch", status: "DECLINED" },
			],
		});
		const text = `${EDITABLE_IMPORT_CSV_HEADER.join(",")}\nfamily@example.com,en,1,Jane,Doe,ADULT,,,ceremony;brunch,jane,1`;
		expect((await importReviewed(text)).result.ok).toBe(true);
		expect(fixture.household.childrenUnder12).toBe(1);
		expect(fixture.household.childAttendance).toEqual([
			{ eventId: "ceremony", count: 1 },
			{ eventId: "brunch", count: 0 },
		]);
		expect(
			fixture.household.guests.find((guest) => guest.id === "child")?.attendance[0].status
		).toBe("ACCEPTED");
	});
	it("discloses child-count reductions before clamping attendance", async () => {
		const text = `${EDITABLE_IMPORT_CSV_HEADER.join(",")}\nfamily@example.com,en,1,Jane,Doe,ADULT,,,ceremony;brunch,jane,1`;
		const { review, result } = await importReviewed(text);
		expect(review.summary.removedChildAttendance).toBe(1);
		expect(result.ok).toBe(true);
		expect(fixture.household.childAttendance).toEqual([
			{ eventId: "ceremony", count: 1 },
			{ eventId: "brunch", count: 1 },
		]);
	});
	it("marks newly invited events pending while retaining earlier answers", async () => {
		for (const guest of fixture.household.guests)
			guest.attendance = guest.attendance.filter((row) => row.eventId === "ceremony");
		fixture.household.childAttendance = [{ eventId: "ceremony", count: 2 }];
		const { review, result } = await importReviewed(legacy);
		expect(review.summary.repliesNeeded).toBe(1);
		expect(result.ok).toBe(true);
		expect(fixture.household.respondedAt).toBeNull();
		for (const guest of fixture.household.guests)
			expect(guest.attendance).toEqual([
				{ eventId: "ceremony", status: "ACCEPTED" },
				{ eventId: "brunch", status: "PENDING" },
			]);
	});
	it("requires admin authorization and a reviewed import before persistence", async () => {
		fixture.requireAdmin.mockRejectedValueOnce(new Error("Unauthorized"));
		await expect(reviewImport(legacy)).rejects.toThrow("Unauthorized");
		expect(fixture.tx.event.findMany).not.toHaveBeenCalled();
		expect((await commitImport(legacy)).ok).toBe(false);
	});
});
