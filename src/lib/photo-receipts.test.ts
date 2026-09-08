import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ find: vi.fn(), update: vi.fn(), head: vi.fn() }));
vi.mock("@/lib/db", () => ({
	db: { photoUploadReceipt: { findUnique: mocks.find, update: mocks.update } },
}));
vi.mock("@/lib/env", () => ({ env: { BLOB_READ_WRITE_TOKEN: "test-store-token" } }));
vi.mock("@vercel/blob", () => ({ head: mocks.head }));

import { verifyPhotoReceipt } from "@/lib/photo-receipts";

const receipt = {
	id: "receipt",
	invitationId: "household",
	pathname: "guest-media/household/receipt",
	url: null,
	cleanup: null,
};

beforeEach(() => vi.resetAllMocks());
describe("photo upload ownership", () => {
	it("rejects arbitrary hero URLs or invented receipt IDs before any storage request", async () => {
		mocks.find.mockResolvedValue(null);
		await expect(
			verifyPhotoReceipt("https://store.public.blob.vercel-storage.com/hero.jpg", "household")
		).rejects.toThrow();
		expect(mocks.head).not.toHaveBeenCalled();
	});
	it("rejects another household's receipt and a receipt already queued for deletion", async () => {
		mocks.find.mockResolvedValue(receipt);
		await expect(verifyPhotoReceipt("receipt", "someone-else")).rejects.toThrow();
		mocks.find.mockResolvedValue({ ...receipt, cleanup: { id: "cleanup" } });
		await expect(verifyPhotoReceipt("receipt", "household")).rejects.toThrow();
		expect(mocks.head).not.toHaveBeenCalled();
	});
	it("verifies the reserved path against the configured store instead of trusting a supplied URL", async () => {
		mocks.find.mockResolvedValue(receipt);
		mocks.head.mockResolvedValue({
			pathname: receipt.pathname,
			contentType: "image/jpeg",
			size: 400,
			url: "https://store.example/verified",
		});
		mocks.update.mockResolvedValue({ ...receipt, url: "https://store.example/verified" });
		await expect(verifyPhotoReceipt("receipt", "household")).resolves.toMatchObject({
			url: "https://store.example/verified",
		});
		expect(mocks.head).toHaveBeenCalledWith(receipt.pathname, { token: "test-store-token" });
	});
	it("rejects a different path or non-image response from storage", async () => {
		mocks.find.mockResolvedValue(receipt);
		mocks.head.mockResolvedValue({ pathname: "hero.jpg", contentType: "image/jpeg", size: 400 });
		await expect(verifyPhotoReceipt("receipt", "household")).rejects.toThrow();
		mocks.head.mockResolvedValue({
			pathname: receipt.pathname,
			contentType: "text/html",
			size: 400,
		});
		await expect(verifyPhotoReceipt("receipt", "household")).rejects.toThrow();
		expect(mocks.update).not.toHaveBeenCalled();
	});
});
