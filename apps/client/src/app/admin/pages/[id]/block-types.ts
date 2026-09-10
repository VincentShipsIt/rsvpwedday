import type { BlockType, Locale } from "@/generated/prisma/enums";

// The admin's shape for a block: every locale at once, because the editor keeps unsaved edits in
// all three while the language switcher only shows one.
export type BlockTranslationState = { locale: Locale; title: string; body: string };

export type BlockItemState = {
	/** Absent until the item has been saved once; the key below is what React and dnd-kit use. */
	id?: string;
	key: string;
	url: string;
	imageUrl: string;
	translations: BlockTranslationState[];
};

export type BlockState = {
	id: string;
	type: BlockType;
	anchor: string;
	imageUrl: string;
	imageUrls: string[];
	url: string;
	translations: BlockTranslationState[];
	items: BlockItemState[];
};

export type PageOption = { id: string; slug: string; path: string; label: string };
