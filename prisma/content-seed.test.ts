import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
	const createMarker = vi.fn();
	const tx = {
		$executeRaw: vi.fn(),
		bootstrapState: { findUnique: vi.fn(), create: createMarker },
		settings: { count: vi.fn(), upsert: vi.fn() },
		siteContent: { count: vi.fn(), upsert: vi.fn(), findUnique: vi.fn() },
		event: { count: vi.fn(), create: vi.fn(), findMany: vi.fn() },
		page: { count: vi.fn() },
		storyMilestone: { count: vi.fn(), create: vi.fn() },
		invitation: { count: vi.fn() },
	};
	return { tx };
});
vi.mock("@/lib/db", () => ({
	db: { $transaction: async (operation: (tx: typeof mocks.tx) => unknown) => operation(mocks.tx) },
}));

import { seedContent } from "./content-seed";

beforeEach(() => {
	vi.resetAllMocks();
	for (const table of [
		mocks.tx.settings,
		mocks.tx.siteContent,
		mocks.tx.event,
		mocks.tx.page,
		mocks.tx.storyMilestone,
		mocks.tx.invitation,
	])
		table.count.mockResolvedValue(0);
	mocks.tx.event.findMany.mockResolvedValue([]);
});

describe("deployment content initialization", () => {
	it("does not restore removed events or milestones once the durable marker exists", async () => {
		mocks.tx.bootstrapState.findUnique.mockResolvedValue({ id: "content-v1" });
		await seedContent();
		expect(mocks.tx.event.create).not.toHaveBeenCalled();
		expect(mocks.tx.storyMilestone.create).not.toHaveBeenCalled();
		expect(mocks.tx.settings.upsert).not.toHaveBeenCalled();
	});
	it("adopts an existing pre-marker site without reseeding an empty event or story table", async () => {
		mocks.tx.settings.count.mockResolvedValue(1);
		await seedContent();
		expect(mocks.tx.bootstrapState.create).toHaveBeenCalledWith({ data: { id: "content-v1" } });
		expect(mocks.tx.event.create).not.toHaveBeenCalled();
		expect(mocks.tx.storyMilestone.create).not.toHaveBeenCalled();
	});
	it("initializes a fresh database and writes its marker after content succeeds", async () => {
		await seedContent();
		expect(mocks.tx.event.create).toHaveBeenCalledTimes(4);
		expect(mocks.tx.storyMilestone.create).toHaveBeenCalledTimes(3);
		expect(mocks.tx.bootstrapState.create).toHaveBeenCalledTimes(1);
	});
	it("fails the transaction without marking an interrupted bootstrap complete", async () => {
		mocks.tx.event.create.mockRejectedValueOnce(new Error("Database interrupted"));
		await expect(seedContent()).rejects.toThrow("Database interrupted");
		expect(mocks.tx.bootstrapState.create).not.toHaveBeenCalled();
	});
});
