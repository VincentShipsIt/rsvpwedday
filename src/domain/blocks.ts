import { BlockType } from "@/generated/prisma/enums";

export const HOME_PAGE_SLUG = "home";

/*
 * What each block type is made of. The admin editor shows exactly these fields, the public
 * renderer reads exactly these fields, and nothing else needs to know a type's shape.
 *
 * - `title`/`body` are per locale (BlockTranslation); `body` is rich text.
 * - `items` are per-locale cards (CARDS) or questions (FAQ).
 * - `builtIn` blocks render data that lives outside the block (events, milestones, settings);
 *   they can appear once per page and their editor links to that data's own admin page.
 */
export type BlockDefinition = {
	label: string;
	description: string;
	builtIn: boolean;
	fields: {
		title: boolean;
		body: boolean;
		image: boolean;
		images: boolean;
		items: boolean;
		anchor: boolean;
		pageLink: boolean;
	};
	/** What `title` means in the editor; defaults to "Heading". */
	titleLabel?: string;
	bodyLabel?: string;
	/** Dictionary key for the heading fallback; `null` means the block has no default heading. */
	defaultHeadingKey:
		| "storyHeading"
		| "eventsHeading"
		| "galleryHeading"
		| "faqHeading"
		| "rsvpHeading"
		| null;
	/** Anchor assigned by the migration and suggested by the editor. */
	defaultAnchor: string;
};

const NO_FIELDS: BlockDefinition["fields"] = {
	title: false,
	body: false,
	image: false,
	images: false,
	items: false,
	anchor: false,
	pageLink: false,
};

export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
	[BlockType.HERO]: {
		label: "Hero",
		description: "The opening photo, the couple's names and the countdown.",
		builtIn: true,
		fields: { ...NO_FIELDS, title: true, image: true },
		titleLabel: "Tagline",
		defaultHeadingKey: null,
		defaultAnchor: "",
	},
	[BlockType.STORY]: {
		label: "Our story",
		description: "The story intro and the milestone timeline.",
		builtIn: true,
		fields: { ...NO_FIELDS, title: true, body: true, anchor: true },
		bodyLabel: "Intro",
		defaultHeadingKey: "storyHeading",
		defaultAnchor: "story",
	},
	[BlockType.EVENTS]: {
		label: "Events",
		description: "The event schedule with venues and calendar links.",
		builtIn: true,
		fields: { ...NO_FIELDS, title: true, anchor: true },
		defaultHeadingKey: "eventsHeading",
		defaultAnchor: "events",
	},
	[BlockType.GALLERY]: {
		label: "Gallery",
		description: "A photo grid.",
		builtIn: true,
		fields: { ...NO_FIELDS, title: true, images: true, anchor: true },
		defaultHeadingKey: "galleryHeading",
		defaultAnchor: "gallery",
	},
	[BlockType.FAQ]: {
		label: "FAQ",
		description: "Questions and answers in an accordion.",
		builtIn: true,
		fields: { ...NO_FIELDS, title: true, items: true, anchor: true },
		defaultHeadingKey: "faqHeading",
		defaultAnchor: "faq",
	},
	[BlockType.RSVP]: {
		label: "RSVP",
		description: "The RSVP note, deadline and contact line.",
		builtIn: true,
		fields: { ...NO_FIELDS, title: true, body: true, anchor: true },
		bodyLabel: "Note",
		defaultHeadingKey: "rsvpHeading",
		defaultAnchor: "rsvp",
	},
	[BlockType.TEXT]: {
		label: "Text",
		description: "A heading and free text.",
		builtIn: false,
		fields: { ...NO_FIELDS, title: true, body: true, anchor: true },
		defaultHeadingKey: null,
		defaultAnchor: "",
	},
	[BlockType.CARDS]: {
		label: "Cards",
		description: "A heading, an intro and a grid of cards with optional links and photos.",
		builtIn: false,
		fields: { ...NO_FIELDS, title: true, body: true, image: true, items: true, anchor: true },
		bodyLabel: "Intro",
		defaultHeadingKey: null,
		defaultAnchor: "",
	},
	[BlockType.IMAGE]: {
		label: "Image",
		description: "One full-width photo with an optional caption.",
		builtIn: false,
		fields: { ...NO_FIELDS, title: true, image: true },
		titleLabel: "Caption",
		defaultHeadingKey: null,
		defaultAnchor: "",
	},
	[BlockType.PAGE_LINK]: {
		label: "Page teaser",
		description: "A card that links to another page, with its own title, text and photo.",
		builtIn: false,
		fields: { ...NO_FIELDS, title: true, body: true, image: true, pageLink: true },
		defaultHeadingKey: null,
		defaultAnchor: "",
	},
};

export const BLOCK_TYPES = Object.keys(BLOCK_DEFINITIONS) as BlockType[];

// Same rule as the old guide anchors: lower-case ASCII, hyphens between words, nothing else, so
// the value is always a valid `id` and URL fragment.
export function slugify(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

// Reserved first path segments a page slug must not shadow.
const RESERVED_SLUGS = new Set(["admin", "rsvp", "api", "opengraph-image", "_next"]);

export function isReservedSlug(slug: string): boolean {
	return RESERVED_SLUGS.has(slug);
}

export function isHomePage(page: { slug: string }): boolean {
	return page.slug === HOME_PAGE_SLUG;
}

export function pagePath(slug: string): string {
	return slug === HOME_PAGE_SLUG ? "/" : `/${slug}`;
}
