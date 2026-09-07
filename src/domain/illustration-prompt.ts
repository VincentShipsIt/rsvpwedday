import { richTextToPlainText } from "@/domain/rich-text";
import { BlockType, SiteTheme } from "@/generated/prisma/enums";

/*
 * Every generated illustration goes through this one builder, so the whole site comes back in a
 * single house style instead of a per-block lottery. The prompt is assembled from three fixed
 * parts (style, subject, rules) and only the subject changes between blocks.
 */

export const ILLUSTRATION_PLACEMENTS = [
	"HERO",
	"GALLERY",
	"CARDS",
	"IMAGE",
	"PAGE_LINK",
	/** One card inside a CARDS block. */
	"ITEM",
	/** A story milestone, which lives outside the block tree (`/admin/settings/milestones`). */
	"MILESTONE",
] as const;

export type IllustrationPlacement = (typeof ILLUSTRATION_PLACEMENTS)[number];

/*
 * Which placement a block's own image field illustrates. `null` is a block type that never shows
 * one — a built-in reading data from elsewhere, or a text-only block — and the exhaustive Record
 * is what makes a new `BlockType` a compile error here rather than a silently missing button.
 */
const blockPlacements: Record<BlockType, IllustrationPlacement | null> = {
	[BlockType.HERO]: "HERO",
	[BlockType.GALLERY]: "GALLERY",
	[BlockType.CARDS]: "CARDS",
	[BlockType.IMAGE]: "IMAGE",
	[BlockType.PAGE_LINK]: "PAGE_LINK",
	[BlockType.STORY]: null,
	[BlockType.EVENTS]: null,
	[BlockType.FAQ]: null,
	[BlockType.RSVP]: null,
	[BlockType.TEXT]: null,
};

export function blockIllustrationPlacement(type: BlockType): IllustrationPlacement | null {
	return blockPlacements[type];
}

export type IllustrationSubject = {
	placement: IllustrationPlacement;
	/** The block's own heading, as typed in the admin. */
	title?: string;
	/** The block's body — rich-text HTML from the editor, or plain text. */
	body?: string;
	/** Story milestones only ("Summer 2019"). */
	dateLabel?: string;
};

export type IllustrationContext = {
	theme: SiteTheme;
	coupleNames: string;
	/** Venues and addresses from the `Event` rows, deduplicated; the wedding's real setting. */
	places: string[];
};

/*
 * One art direction per theme, describing the medium, the palette and the light. Colours are the
 * theme's own tokens copied from the `[data-theme]` blocks in `globals.css` (the same verbatim
 * copy `src/emails/theme.ts` keeps for mail clients), written as prose because that is what an
 * image model can act on.
 *
 * Each line names a look, never a printing process. "Screenprint", "risograph print" and
 * "misregistration" make the model draw the printed artefact instead of the picture — a sheet with
 * a margin, or literal off-register plates floating apart — which no amount of shouting in `RULES`
 * undoes. Describe the palette, the marks and the light.
 */
const themeStyles: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]:
		"Quiet editorial illustration: fine ink contours over flat washes, generous negative space, warm ivory ground (#faf7f0) with deep pine-green accents (#2f4d3a), soft low side light late in the afternoon.",
	[SiteTheme.MODERN]:
		"Spare graphic illustration: bold flat colour shapes with almost no outline, an off-white base tone (#f7f5f1) carried through the scene itself, a single burnt-orange accent (#c8552d), hard clean light and confident geometric composition.",
	[SiteTheme.GARDEN]:
		"Loose botanical watercolour: wet-in-wet blooms, visible paper grain, dusty-rose ground (#f6e7e1) with terracotta accents (#b5533c), diffuse morning light.",
	[SiteTheme.MIDNIGHT]:
		"Nocturne gouache on a near-black ground (#0f1113): warm candlelight pooling at the centre, antique-gold highlights (#c9a961), deep shadow and restrained detail.",
	[SiteTheme.BOHO]:
		"Earthy risograph palette: two or three flat inks that darken where they overlap, sand base (#f3e9d2) with amber accents (#d97b3a), coarse grain throughout, warm dusk light.",
	[SiteTheme.VINTAGE]:
		"Faded mid-century travel-poster look: flat matte colour in a tightly limited range over a warm aged-cream base (#f8f0d7) with sage accents (#8a9a72), simplified shapes and a soft grain within each colour area, even daylight.",
	[SiteTheme.MEDITERRANEAN]:
		"Sunlit Mediterranean gouache: chalky whitewash ground (#fdf9ec), deep sea-blue accents (#1d4f91), lemon and olive greens, high bright midday sun and crisp shadows.",
};

/*
 * What the block is for, so a hero reads as a wide establishing scene and a guide card as a small
 * object study. The model gets the intent; `illustrationAspectRatio` gets the frame.
 */
const placementBriefs: Record<IllustrationPlacement, string> = {
	HERO: "A wide establishing scene setting the mood for the whole page.",
	GALLERY: "A decorative scene that sits alongside the couple's own photographs.",
	CARDS: "A wide banner introducing a group of cards.",
	IMAGE: "A standalone picture carrying its own section of the page.",
	PAGE_LINK: "A wide banner teasing another page of the site.",
	ITEM: "A single clear subject for a small card: one place, dish or object.",
	MILESTONE: "A small intimate vignette illustrating one moment in the couple's story.",
};

const placementAspectRatios: Record<IllustrationPlacement, string> = {
	HERO: "16:9",
	GALLERY: "1:1",
	CARDS: "16:9",
	IMAGE: "3:2",
	PAGE_LINK: "16:9",
	ITEM: "3:2",
	MILESTONE: "4:3",
};

export function illustrationAspectRatio(placement: IllustrationPlacement): string {
	return placementAspectRatios[placement];
}

const MAX_SUBJECT_CHARS = 600;

function describeSubject(subject: IllustrationSubject): string {
	const body = subject.body ? richTextToPlainText(subject.body).replaceAll("\n", " ") : "";
	const parts = [subject.dateLabel, subject.title, body]
		.map((part) => part?.trim())
		.filter((part): part is string => Boolean(part));

	if (parts.length === 0) {
		return placementBriefs[subject.placement];
	}

	return `${placementBriefs[subject.placement]} It illustrates: ${parts.join(" — ").slice(0, MAX_SUBJECT_CHARS)}`;
}

function describeSetting(context: IllustrationContext): string {
	if (context.places.length === 0) {
		return "The wedding's own setting is not recorded, so keep the scene unplaceable rather than inventing a landmark.";
	}

	return `The wedding takes place at ${context.places.join("; ")}. Draw that region's real landscape, architecture, light and plant life — not a generic one.`;
}

/*
 * The rules block is the part that keeps a set of images looking like a set: no lettering (image
 * models spell badly and the site supplies its own type), and no faces, which is where an
 * illustration of real guests turns uncanny.
 *
 * The bleed rule earns its length. Asked for a watercolour, the model reaches for the medium's
 * convention and paints a sheet of paper — deckle edge, white margin and all — which the site then
 * crops unpredictably with `object-cover`. Naming those artefacts removes the hard border but
 * leaves a vignette in its place, so the rule also has to say where the colour has to reach, and
 * that the output *is* the picture rather than a photograph of one.
 */
const RULES = [
	"No text, letters, numbers, captions, signatures or watermarks anywhere in the image, and none on signs, crates, labels, awnings or packaging within the scene. The words and dates above describe the picture; they are never written into it.",
	"No recognisable faces: any people are small, turned away, or suggested in a few strokes.",
	"The artwork bleeds off all four edges: colour reaches every corner and the composition is cut off by the frame rather than fading or tapering before it. No white margin, no paper border or deckle edge, no mount, frame, keyline, vignette or drop shadow, and no bare unpainted ground. The output is the picture itself, not a photograph of a painting lying on a surface.",
	"Keep the important subject away from the outer tenth of the frame; the site crops these images.",
	"An illustration, never a photograph, a 3D render or a photo-realistic composite.",
].join("\n- ");

export function buildIllustrationPrompt(
	subject: IllustrationSubject,
	context: IllustrationContext
): string {
	return [
		`An illustration for the wedding website of ${context.coupleNames}.`,
		"",
		"STYLE — identical for every image on this site, do not vary it:",
		themeStyles[context.theme],
		"",
		"SUBJECT:",
		describeSubject(subject),
		"",
		"SETTING:",
		describeSetting(context),
		"",
		"RULES:",
		`- ${RULES}`,
	].join("\n");
}
