import { beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => {
	const page = { id: "travel", slug: "guide" };
	const links = new Map<string, { type: string; url: string | null }>();
	const tx = {
		page: {
			update: vi.fn(async ({ data }: { data: { slug: string } }) => {
				page.slug = data.slug;
			}),
			delete: vi.fn(),
		},
		pageTranslation: { upsert: vi.fn() },
		block: {
			updateMany: vi.fn(
				async ({
					where,
					data,
				}: {
					where: { type: string; url: string };
					data: { url: string | null };
				}) => {
					for (const link of links.values())
						if (link.type === where.type && link.url === where.url) link.url = data.url;
				}
			),
		},
	};
	return { page, links, tx, requireAdmin: vi.fn() };
});
vi.mock("@/lib/require-admin", () => ({ requireAdmin: fixture.requireAdmin }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({
	db: {
		page: {
			findUnique: vi.fn(async ({ where }: { where: { id?: string; slug?: string } }) =>
				where.id ? { ...fixture.page } : null
			),
		},
		$transaction: (run: (tx: typeof fixture.tx) => unknown) => run(fixture.tx),
	},
}));

import { deletePage, updatePageSettings } from "@/app/admin/pages/actions";

beforeEach(() => {
	vi.clearAllMocks();
	fixture.page.slug = "guide";
	fixture.links.clear();
	fixture.links.set("teaser", { type: "PAGE_LINK", url: "/guide" });
	fixture.links.set("external", { type: "PAGE_LINK", url: "https://example.com/guide" });
	fixture.links.set("card", { type: "CARDS", url: "/guide" });
});

describe("page teaser references", () => {
	it("rewrites matching internal teasers in the same transaction as a page rename", async () => {
		await updatePageSettings({ id: "travel", slug: "travel", showInNav: true, translations: [] });
		expect(fixture.page.slug).toBe("travel");
		expect(fixture.links.get("teaser")?.url).toBe("/travel");
		expect(fixture.links.get("external")?.url).toBe("https://example.com/guide");
		expect(fixture.links.get("card")?.url).toBe("/guide");
	});
	it("clears incoming teasers when the page is deleted", async () => {
		await deletePage("travel");
		expect(fixture.links.get("teaser")?.url).toBeNull();
		expect(fixture.tx.page.delete).toHaveBeenCalledWith({ where: { id: "travel" } });
	});
});
