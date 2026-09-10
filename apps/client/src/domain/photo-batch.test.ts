import { describe, expect, it, vi } from "vitest";
import { type PendingPhoto, savePhotoBatch } from "@/domain/photo-batch";

describe("resumable photo batches", () => {
	it("preserves completed photos and reuses the failed photo receipt on retry", async () => {
		const queue: PendingPhoto<string>[] = [{ file: "first" }, { file: "second" }];
		const stored = new Set<string>();
		const registered = new Set<string>();
		let serial = 0;
		let fail = true;
		const operations = {
			prepare: vi.fn(async () => ({ id: `${++serial}`, pathname: `guest-media/${serial}` })),
			upload: vi.fn(async (_file: string, receipt: { id: string }) => {
				stored.add(receipt.id);
				if (receipt.id === "2" && fail) throw new Error("Connection lost after upload");
			}),
			register: vi.fn(async (id: string) => {
				if (!stored.has(id)) return false;
				registered.add(id);
				return true;
			}),
			progress: vi.fn(),
		};
		await expect(savePhotoBatch(queue, operations)).rejects.toThrow();
		expect([...registered]).toEqual(["1"]);
		expect(queue.map((item) => item.file)).toEqual(["second"]);
		fail = false;
		await savePhotoBatch(queue, operations);
		expect(queue).toEqual([]);
		expect([...registered]).toEqual(["1", "2"]);
		expect(operations.upload).toHaveBeenCalledTimes(2);
		expect(operations.prepare).toHaveBeenCalledTimes(2);
	});

	it("retains the receipt when a server action throws after storage succeeds", async () => {
		const queue: PendingPhoto<string>[] = [{ file: "photo" }];
		const prepare = vi.fn(async () => ({ id: "receipt", pathname: "guest-media/receipt" }));
		const upload = vi.fn(async () => {});
		await expect(
			savePhotoBatch(queue, {
				prepare,
				upload,
				register: async () => {
					throw new Error("Server unavailable");
				},
				progress: () => {},
			})
		).rejects.toThrow("Server unavailable");
		expect(queue[0].receipt?.id).toBe("receipt");
		await savePhotoBatch(queue, {
			prepare,
			upload,
			register: async () => true,
			progress: () => {},
		});
		expect(upload).toHaveBeenCalledTimes(1);
		expect(queue).toHaveLength(0);
	});
});
