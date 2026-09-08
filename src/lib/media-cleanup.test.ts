import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
	jobs: vi.fn(),
	find: vi.fn(),
	lock: vi.fn(),
	update: vi.fn(),
	count: vi.fn(),
	head: vi.fn(),
	del: vi.fn(),
}));
vi.mock("@/lib/db", () => {
	const tx = {
		$queryRaw: mocks.lock,
		mediaCleanup: { findUnique: mocks.find, update: mocks.update },
	};
	return {
		db: {
			$transaction: async (operation: (client: typeof tx) => unknown) => operation(tx),
			mediaCleanup: { findMany: mocks.jobs, update: mocks.update, count: mocks.count },
		},
	};
});
vi.mock("@/lib/env", () => ({ env: { BLOB_READ_WRITE_TOKEN: "test" } }));
vi.mock("@vercel/blob", () => ({
	head: mocks.head,
	del: mocks.del,
	BlobNotFoundError: class extends Error {},
}));

import { processMediaCleanup, queueInvitationMediaCleanup } from "@/lib/media-cleanup";

beforeEach(() => vi.resetAllMocks());
describe("durable media deletion", () => {
	it("retains cleanup work after storage failure and completes it on retry", async () => {
		const job = { id: "job", receipt: { pathname: "guest-media/invitation/receipt" } };
		mocks.jobs.mockResolvedValue([job]);
		mocks.find.mockResolvedValue({ ...job, readyAt: new Date(0), completedAt: null });
		mocks.head.mockResolvedValue({
			pathname: job.receipt.pathname,
			url: "https://verified-store/photo",
		});
		mocks.del.mockRejectedValueOnce(new Error("Storage outage")).mockResolvedValue(undefined);
		mocks.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
		expect(await processMediaCleanup()).toEqual({ completed: 0, pending: 1 });
		expect(mocks.update.mock.calls[0][0].data).not.toHaveProperty("completedAt");
		expect(await processMediaCleanup()).toEqual({ completed: 1, pending: 0 });
		expect(mocks.update.mock.calls[1][0].data.completedAt).toBeInstanceOf(Date);
	});
	it("queues every household receipt, including unfinished uploads, but no legacy URL", async () => {
		const expiresAt = new Date("2026-09-08T12:00:00Z");
		const receipts = [
			{ id: "one", expiresAt },
			{ id: "two", expiresAt },
		];
		const upsert = vi.fn();
		const tx = {
			$queryRaw: vi.fn(),
			photoUploadReceipt: {
				findMany: vi.fn(async () => receipts),
				findUniqueOrThrow: vi.fn(async ({ where }: { where: { id: string } }) =>
					receipts.find((r) => r.id === where.id)
				),
			},
			mediaCleanup: { upsert },
			photo: { count: vi.fn(async () => 1) },
		} as unknown as Prisma.TransactionClient;
		expect(await queueInvitationMediaCleanup(tx, "household")).toEqual({
			queued: 2,
			legacyCount: 1,
		});
		expect(upsert).toHaveBeenCalledTimes(2);
		expect(upsert.mock.calls[0][0].create.readyAt).toEqual(new Date("2026-09-08T12:05:00Z"));
		expect(mocks.del).not.toHaveBeenCalled();
	});
});
