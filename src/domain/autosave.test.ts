import { describe, expect, it, vi } from "vitest";
import { Autosave } from "@/domain/autosave";
import type { FormActionResult } from "@/lib/form-action";

function deferred() {
	let resolve!: (result: FormActionResult) => void;
	const promise = new Promise<FormActionResult>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

describe("autosave durability", () => {
	it("saves a reversion while the previous draft is in flight", async () => {
		const first = deferred();
		const save = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue({ ok: true });
		const controller = new Autosave<string>("A", save);
		controller.update("B");
		const pending = controller.flush();
		controller.update("A");
		first.resolve({ ok: true });
		await pending;
		expect(save.mock.calls).toEqual([["B"], ["A"]]);
		expect(controller.state.status).toBe("saved");
		expect(controller.dirty).toBe(false);
	});

	it("survives detached editors and keeps a failed save retryable", async () => {
		const first = deferred();
		const save = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue({ ok: true });
		const retryNotice = vi.fn();
		const controller = new Autosave<string>("A", save, retryNotice);
		const unsubscribe = controller.subscribe(() => {});
		controller.update("B");
		unsubscribe();
		const pending = controller.flush();
		first.resolve({ ok: false, error: "Offline" });
		await pending;
		expect(controller.dirty).toBe(true);
		expect(retryNotice).toHaveBeenCalledOnce();
		await controller.flush();
		expect(save.mock.calls).toEqual([["B"], ["B"]]);
		expect(controller.state.status).toBe("saved");
	});

	it("serializes writes and persists the latest queued draft", async () => {
		const first = deferred();
		const save = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue({ ok: true });
		const controller = new Autosave<string>("A", save);
		controller.update("B");
		const pending = controller.flush();
		controller.update("C");
		void controller.flush();
		controller.update("D");
		expect(save).toHaveBeenCalledTimes(1);
		first.resolve({ ok: true });
		await pending;
		expect(save.mock.calls).toEqual([["B"], ["D"]]);
	});
});
