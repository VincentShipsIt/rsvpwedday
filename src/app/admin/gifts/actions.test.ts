import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAdmin: vi.fn(),
	deleteMany: vi.fn(),
	revalidatePath: vi.fn(),
}));
vi.mock("@/lib/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/db", () => ({ db: { giftClaim: { deleteMany: mocks.deleteMany } } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { releaseClaim } from "@/app/admin/gifts/actions";

describe("admin release of a reviewed gift reservation", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});
	it("rejects an unauthenticated direct invocation before persistence", async () => {
		mocks.requireAdmin.mockRejectedValue(new Error("Unauthorized"));
		await expect(releaseClaim("gift", "reviewed-version")).rejects.toThrow("Unauthorized");
		expect(mocks.deleteMany).not.toHaveBeenCalled();
	});
	it.each(["another-household-version", "same-household-new-version"])(
		"preserves a replacement claim (%s)",
		async (currentVersion) => {
			mocks.deleteMany.mockImplementation(({ where }) =>
				Promise.resolve({ count: where.version === currentVersion ? 1 : 0 })
			);
			expect(await releaseClaim("gift", "reviewed-version")).toMatchObject({ ok: false });
			expect(mocks.deleteMany).toHaveBeenCalledWith({
				where: { giftId: "gift", version: "reviewed-version" },
			});
			expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/gifts");
		}
	);
	it("releases an unchanged reviewed claim", async () => {
		mocks.deleteMany.mockResolvedValue({ count: 1 });
		expect(await releaseClaim("gift", "reviewed-version")).toEqual({ ok: true });
	});
});
