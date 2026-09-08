"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { BlockState } from "@/app/admin/pages/[id]/block-types";
import {
	BLOCK_DEFINITIONS,
	HOME_PAGE_SLUG,
	isReservedSlug,
	pagePath,
	slugify,
} from "@/domain/blocks";
import { isAllowedImageUrl } from "@/domain/image-url";
import { sanitizeRichText } from "@/domain/rich-text";
import { notDeleted, retireUniqueValue } from "@/domain/soft-delete";
import type { BlockType, Locale } from "@/generated/prisma/enums";
import { localeCodes } from "@/i18n/locales";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";
import { requireAdmin } from "@/lib/require-admin";

const imageUrlSchema = z.string().refine((value) => value === "" || isAllowedImageUrl(value), {
	message: "must be a valid https image URL",
});

// A card's outbound link: empty, or an absolute http(s) URL so a guest never lands on a broken
// or `javascript:` href. A page teaser points at one of our own pages instead, so it also allows
// a root-relative path.
const linkUrlSchema = z.union([z.literal(""), z.url({ protocol: /^https?$/ })]);
const pageLinkSchema = z.union([z.literal(""), z.string().regex(/^\/[a-z0-9-/]*$/)]);

// Every public page plus the admin's own list, because a saved block changes the nav on all of
// them (a heading feeds the anchor label, a page teaser feeds the footer).
function revalidateSite(slug?: string) {
	revalidatePath("/admin/pages", "layout");
	revalidatePath("/", "layout");
	if (slug) {
		revalidatePath(pagePath(slug));
	}
}

// ---- Pages ----

export type PageTranslationInput = { locale: Locale; title: string; intro: string };

export async function createPage(input: {
	slug: string;
}): Promise<FormActionResult & { id?: string }> {
	await requireAdmin();
	const slug = slugify(input.slug);
	if (!slug) {
		return { ok: false, error: "Enter a name for the page." };
	}
	if (slug === HOME_PAGE_SLUG || isReservedSlug(slug)) {
		return { ok: false, error: `"${slug}" is reserved — pick another name.` };
	}
	if (await db.page.findUnique({ where: { slug } })) {
		return { ok: false, error: `A page called "${slug}" already exists.` };
	}

	const last = await db.page.findFirst({ orderBy: { sortOrder: "desc" } });
	const page = await db.page.create({
		data: {
			slug,
			sortOrder: (last?.sortOrder ?? -1) + 1,
			translations: { create: localeCodes.map((locale) => ({ locale })) },
		},
	});

	revalidateSite();
	return { ok: true, id: page.id };
}

export async function updatePageSettings(input: {
	id: string;
	slug: string;
	showInNav: boolean;
	translations: PageTranslationInput[];
}): Promise<FormActionResult> {
	await requireAdmin();
	const page = await db.page.findUnique({ where: { id: input.id } });
	if (!page) {
		return { ok: false, error: "That page no longer exists." };
	}

	// The home page keeps its slug: it is the root route, not a path.
	const slug = page.slug === HOME_PAGE_SLUG ? HOME_PAGE_SLUG : slugify(input.slug);
	if (!slug) {
		return { ok: false, error: "Enter a name for the page." };
	}
	if (slug !== page.slug) {
		if (isReservedSlug(slug) || slug === HOME_PAGE_SLUG) {
			return { ok: false, error: `"${slug}" is reserved — pick another name.` };
		}
		const clash = await db.page.findUnique({ where: { slug } });
		if (clash && clash.id !== page.id) {
			return { ok: false, error: `A page called "${slug}" already exists.` };
		}
	}

	await db.$transaction(async (tx) => {
		if (slug !== page.slug) {
			await tx.block.updateMany({
				where: { type: "PAGE_LINK", url: pagePath(page.slug) },
				data: { url: pagePath(slug) },
			});
		}
		await tx.page.update({
			where: { id: page.id },
			data: { slug, showInNav: input.showInNav },
		});
		for (const translation of input.translations) {
			await tx.pageTranslation.upsert({
				where: { pageId_locale: { pageId: page.id, locale: translation.locale } },
				create: {
					pageId: page.id,
					locale: translation.locale,
					title: translation.title,
					intro: sanitizeRichText(translation.intro),
				},
				update: { title: translation.title, intro: sanitizeRichText(translation.intro) },
			});
		}
	});

	revalidateSite(page.slug);
	revalidateSite(slug);
	return { ok: true };
}

export async function deletePage(id: string): Promise<FormActionResult> {
	await requireAdmin();
	const page = await db.page.findUnique({ where: { id } });
	if (!page) {
		return { ok: true };
	}
	if (page.slug === HOME_PAGE_SLUG) {
		return { ok: false, error: "The home page can't be deleted." };
	}
	// The blocks go with it by hand, since `onDelete: Cascade` no longer fires, and the slug leaves
	// the live namespace so the couple can create a page at that path again.
	const now = new Date();
	await db.$transaction(async (tx) => {
		await tx.block.updateMany({
			where: { type: "PAGE_LINK", url: pagePath(page.slug) },
			data: { url: null },
		});
		await tx.blockItem.updateMany({ where: { block: { pageId: id } }, data: { deletedAt: now } });
		await tx.block.updateMany({ where: { pageId: id }, data: { deletedAt: now } });
		await tx.page.update({
			where: { id },
			data: { deletedAt: now, slug: retireUniqueValue(page.slug, now) },
		});
	});
	revalidateSite(page.slug);
	return { ok: true };
}

export async function reorderPages(ids: string[]): Promise<FormActionResult> {
	await requireAdmin();
	await db.$transaction(
		ids.map((id, sortOrder) => db.page.update({ where: { id }, data: { sortOrder } }))
	);
	revalidateSite();
	return { ok: true };
}

// ---- Blocks ----

export type BlockItemInput = {
	id?: string;
	sortOrder: number;
	url: string;
	imageUrl: string;
	translations: { locale: Locale; title: string; body: string }[];
};

export type BlockInput = {
	id: string;
	anchor: string;
	imageUrl: string;
	imageUrls: string[];
	url: string;
	translations: { locale: Locale; title: string; body: string }[];
	items: BlockItemInput[];
};

// Returns the created block ready to drop into the editor's list, so adding one never depends on
// a server refresh landing before the next render.
export async function createBlock(input: {
	pageId: string;
	type: BlockType;
	/** Insert directly below this block; omitted appends to the end. */
	afterBlockId?: string;
}): Promise<FormActionResult & { block?: BlockState; position?: number }> {
	await requireAdmin();
	const page = await db.page.findUnique({
		where: { id: input.pageId },
		include: {
			blocks: {
				where: notDeleted,
				orderBy: { sortOrder: "asc" },
				select: { id: true, type: true },
			},
		},
	});
	if (!page) {
		return { ok: false, error: "That page no longer exists." };
	}

	const definition = BLOCK_DEFINITIONS[input.type];
	// A built-in block renders one fixed thing (the event list, the RSVP form); two of them on a
	// page would just repeat it.
	if (definition.builtIn && page.blocks.some((block) => block.type === input.type)) {
		return { ok: false, error: `This page already has a ${definition.label} block.` };
	}

	const anchor = definition.fields.anchor
		? uniqueAnchor(definition.defaultAnchor, new Set<string>())
		: "";

	const afterIndex = input.afterBlockId
		? page.blocks.findIndex((block) => block.id === input.afterBlockId)
		: -1;
	const position = afterIndex === -1 ? page.blocks.length : afterIndex + 1;

	const created = await db.$transaction(async (tx) => {
		for (const [index, block] of page.blocks.entries()) {
			const sortOrder = index < position ? index : index + 1;
			await tx.block.update({ where: { id: block.id }, data: { sortOrder } });
		}
		return tx.block.create({
			data: {
				pageId: page.id,
				sortOrder: position,
				type: input.type,
				anchor,
				translations: { create: localeCodes.map((locale) => ({ locale })) },
			},
		});
	});

	revalidateSite(page.slug);
	return {
		ok: true,
		position,
		block: {
			id: created.id,
			type: created.type,
			anchor: created.anchor,
			imageUrl: "",
			imageUrls: [],
			url: "",
			translations: localeCodes.map((code) => ({ locale: code, title: "", body: "" })),
			items: [],
		},
	};
}

// Saves one block and nothing else. Every field the block's type does not declare is ignored, so
// a stale client can never blank a column that its editor never showed.
export async function updateBlock(input: BlockInput): Promise<FormActionResult> {
	await requireAdmin();
	const block = await db.block.findUnique({
		where: { id: input.id },
		include: {
			page: { select: { slug: true, id: true } },
			items: { where: notDeleted, select: { id: true } },
		},
	});
	if (!block) {
		return { ok: false, error: "That block no longer exists." };
	}

	const fields = BLOCK_DEFINITIONS[block.type].fields;

	if (fields.image && !imageUrlSchema.safeParse(input.imageUrl).success) {
		return { ok: false, error: "Enter a valid https image URL for the photo." };
	}
	if (fields.images) {
		for (const url of input.imageUrls) {
			if (!imageUrlSchema.safeParse(url).success) {
				return { ok: false, error: "One of the photos is not a valid https image URL." };
			}
		}
	}
	if (fields.pageLink && !pageLinkSchema.safeParse(input.url).success) {
		return { ok: false, error: "Pick a page for this teaser to link to." };
	}
	if (fields.pageLink && input.url) {
		const target = await db.page.findUnique({
			where: { slug: input.url === "/" ? HOME_PAGE_SLUG : input.url.slice(1) },
		});
		if (!target)
			return { ok: false, error: "That page no longer exists. Pick another page for the teaser." };
	}
	if (fields.items) {
		for (const [index, item] of input.items.entries()) {
			if (!imageUrlSchema.safeParse(item.imageUrl).success) {
				return { ok: false, error: `Card ${index + 1} has an invalid image URL.` };
			}
			if (!linkUrlSchema.safeParse(item.url).success) {
				return { ok: false, error: `Card ${index + 1} needs a full http(s) link.` };
			}
		}
	}

	// The anchor is this page's `#fragment`, so it has to be unique within the page.
	let anchor = "";
	if (fields.anchor) {
		const siblings = await db.block.findMany({
			where: { pageId: block.pageId, id: { not: block.id } },
			select: { anchor: true },
		});
		anchor = uniqueAnchor(
			slugify(input.anchor),
			new Set(siblings.map((sibling) => sibling.anchor).filter(Boolean))
		);
	}

	const submittedItemIds = new Set(input.items.map((item) => item.id).filter(Boolean));
	const existingItemIds = new Set(block.items.map((item) => item.id));

	await db.$transaction(async (tx) => {
		await tx.block.update({
			where: { id: block.id },
			data: {
				anchor,
				imageUrl: fields.image ? input.imageUrl || null : block.imageUrl,
				imageUrls: fields.images ? input.imageUrls.filter(Boolean) : block.imageUrls,
				url: fields.pageLink ? input.url || null : block.url,
			},
		});

		for (const translation of input.translations) {
			await tx.blockTranslation.upsert({
				where: { blockId_locale: { blockId: block.id, locale: translation.locale } },
				create: {
					blockId: block.id,
					locale: translation.locale,
					title: fields.title ? translation.title : "",
					body: fields.body ? sanitizeRichText(translation.body) : "",
				},
				update: {
					...(fields.title ? { title: translation.title } : {}),
					...(fields.body ? { body: sanitizeRichText(translation.body) } : {}),
				},
			});
		}

		if (!fields.items) {
			return;
		}

		for (const itemId of existingItemIds) {
			if (!submittedItemIds.has(itemId)) {
				await tx.blockItem.update({ where: { id: itemId }, data: { deletedAt: new Date() } });
			}
		}

		for (const [sortOrder, item] of input.items.entries()) {
			const data = {
				blockId: block.id,
				sortOrder,
				url: item.url || null,
				imageUrl: item.imageUrl || null,
			};
			if (item.id && existingItemIds.has(item.id)) {
				await tx.blockItem.update({ where: { id: item.id }, data });
				for (const translation of item.translations) {
					await tx.blockItemTranslation.upsert({
						where: { itemId_locale: { itemId: item.id, locale: translation.locale } },
						create: {
							itemId: item.id,
							locale: translation.locale,
							title: translation.title,
							body: sanitizeRichText(translation.body),
						},
						update: { title: translation.title, body: sanitizeRichText(translation.body) },
					});
				}
			} else {
				await tx.blockItem.create({
					data: {
						// The editor mints the id, so this stays an insert-once even if a save is retried.
						...(item.id ? { id: item.id } : {}),
						...data,
						translations: {
							create: item.translations.map((translation) => ({
								locale: translation.locale,
								title: translation.title,
								body: sanitizeRichText(translation.body),
							})),
						},
					},
				});
			}
		}
	});

	revalidateSite(block.page.slug);
	return { ok: true };
}

export async function deleteBlock(id: string): Promise<FormActionResult> {
	await requireAdmin();
	const block = await db.block.findUnique({
		where: { id },
		include: { page: { select: { slug: true } } },
	});
	if (!block) {
		return { ok: true };
	}
	const now = new Date();
	await db.$transaction(async (tx) => {
		await tx.blockItem.updateMany({ where: { blockId: id }, data: { deletedAt: now } });
		await tx.block.update({ where: { id }, data: { deletedAt: now } });
	});
	revalidateSite(block.page.slug);
	return { ok: true };
}

export async function reorderBlocks(input: {
	pageId: string;
	ids: string[];
}): Promise<FormActionResult> {
	await requireAdmin();
	const page = await db.page.findUnique({ where: { id: input.pageId } });
	if (!page) {
		return { ok: false, error: "That page no longer exists." };
	}
	await db.$transaction(
		input.ids.map((id, sortOrder) => db.block.update({ where: { id }, data: { sortOrder } }))
	);
	revalidateSite(page.slug);
	return { ok: true };
}

function uniqueAnchor(base: string, taken: Set<string>): string {
	if (!base) {
		return "";
	}
	let anchor = base;
	let suffix = 2;
	while (taken.has(anchor)) {
		anchor = `${base}-${suffix}`;
		suffix += 1;
	}
	return anchor;
}
