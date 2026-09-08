import { beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => {
	const events = new Map<string, Record<string, unknown>>();
	const milestones = new Map<string, Record<string, unknown>>();
	const attendance = new Map<string, string>();
	const store = (rows: typeof events) => ({
		findMany: vi.fn(async () => [...rows.keys()].map((id) => ({ id, ...rows.get(id) }))),
		create: vi.fn(async ({ data }: { data: Record<string, unknown> & { id: string } }) => {
			rows.set(data.id, data);
			return data;
		}),
		update: vi.fn(
			async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
				rows.set(where.id, { ...rows.get(where.id), ...data });
			}
		),
		delete: vi.fn(async ({ where }: { where: { id: string } }) => {
			rows.delete(where.id);
		}),
	});
	const event = {
		...store(events),
		deleteMany: vi.fn(async ({ where }: { where: { id: { in: string[] } } }) => {
			for (const id of where.id.in) {
				events.delete(id);
				attendance.delete(id);
			}
		}),
	};
	const db = {
		event,
		storyMilestone: store(milestones),
		settings: { findUnique: vi.fn(async () => ({ timeZone: "UTC" })) },
		siteContent: { upsert: vi.fn() },
		eventTranslation: { upsert: vi.fn() },
		storyMilestoneTranslation: { upsert: vi.fn() },
	};
	return { events, milestones, attendance, db, requireAdmin: vi.fn() };
});
vi.mock("@/lib/require-admin", () => ({ requireAdmin: fixture.requireAdmin }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({
	db: { ...fixture.db, $transaction: (run: (tx: typeof fixture.db) => unknown) => run(fixture.db) },
}));

import { type EventInput, updateEvents, updateStory } from "@/app/admin/settings/site-actions";

const event: EventInput = {
	id: "stable-event",
	slug: "ceremony",
	startsAt: "2026-09-08T15:00",
	endsAt: "",
	venue: "",
	address: "",
	mapsUrl: "",
	dressCode: "",
	sortOrder: 0,
	showPublicly: true,
	translations: [{ locale: "en", name: "Ceremony", description: "" }],
};

beforeEach(() => {
	fixture.events.clear();
	fixture.milestones.clear();
	fixture.attendance.clear();
	vi.clearAllMocks();
});

describe("event and milestone persistence", () => {
	it("retains client IDs and attendance through repeated event saves", async () => {
		expect(await updateEvents({ events: [event] })).toEqual({ ok: true });
		fixture.attendance.set(event.id ?? "", "ACCEPTED");
		expect(await updateEvents({ events: [{ ...event, venue: "Updated venue" }] })).toEqual({
			ok: true,
		});
		expect([...fixture.events.keys()]).toEqual([event.id]);
		expect(fixture.attendance.get(event.id ?? "")).toBe("ACCEPTED");
		expect(fixture.db.event.create).toHaveBeenCalledTimes(1);
	});
	it("does not delete events omitted by a stale editor, but deletes explicitly confirmed IDs", async () => {
		fixture.events.set("another-event", {});
		fixture.attendance.set("another-event", "ACCEPTED");
		await updateEvents({ events: [event] });
		expect(fixture.attendance.get("another-event")).toBe("ACCEPTED");
		await updateEvents({ events: [event], deletedEventIds: ["another-event"] });
		expect(fixture.events.has(event.id ?? "")).toBe(true);
		expect(fixture.events.has("another-event")).toBe(false);
		expect(fixture.attendance.has("another-event")).toBe(false);
	});
	it("retains milestone IDs on subsequent saves", async () => {
		const milestone = {
			id: "stable-milestone",
			sortOrder: 0,
			dateLabel: "Summer",
			imageUrl: "",
			translations: [{ locale: "en" as const, title: "A beginning", body: "" }],
		};
		await updateStory({ milestones: [milestone] });
		await updateStory({ milestones: [{ ...milestone, dateLabel: "Autumn" }] });
		expect([...fixture.milestones.keys()]).toEqual([milestone.id]);
		expect(fixture.db.storyMilestone.create).toHaveBeenCalledTimes(1);
	});
	it("authenticates before reading or changing persisted state", async () => {
		fixture.requireAdmin.mockRejectedValueOnce(new Error("Unauthorized"));
		await expect(updateEvents({ events: [event] })).rejects.toThrow("Unauthorized");
		expect(fixture.db.settings.findUnique).not.toHaveBeenCalled();
	});
});
