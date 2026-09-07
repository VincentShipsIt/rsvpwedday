import { richTextToPlainText } from "@/domain/rich-text";
import { SiteTheme } from "@/generated/prisma/enums";

/*
 * Every generated illustration goes through this one builder, so the whole site comes back in a
 * single house style instead of a per-block lottery. The prompt is assembled from three fixed
 * parts (style, subject, rules) and only the subject changes between blocks.
 */

export const ILLUSTRATION_PLACEMENTS = [
	"hero",
	"story",
	"gallery",
	"guideSection",
	"guideItem",
] as const;

export type IllustrationPlacement = (typeof ILLUSTRATION_PLACEMENTS)[number];

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
 */
const themeStyles: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]:
		"Quiet editorial illustration: fine ink contours over flat washes, generous negative space, warm ivory ground (#faf7f0) with deep pine-green accents (#2f4d3a), soft low side light late in the afternoon.",
	[SiteTheme.MODERN]:
		"Spare graphic illustration: bold flat colour shapes with almost no outline, off-white ground (#f7f5f1), a single burnt-orange accent (#c8552d), hard clean light and confident geometric composition.",
	[SiteTheme.GARDEN]:
		"Loose botanical watercolour: wet edges, visible paper grain, dusty-rose ground (#f6e7e1) with terracotta accents (#b5533c), diffuse morning light.",
	[SiteTheme.MIDNIGHT]:
		"Nocturne gouache on a near-black ground (#0f1113): warm candlelight pooling at the centre, antique-gold highlights (#c9a961), deep shadow and restrained detail.",
	[SiteTheme.BOHO]:
		"Earthy risograph print: two or three overlapping flat inks with slight misregistration, sand ground (#f3e9d2) with amber accents (#d97b3a), warm dusk light.",
	[SiteTheme.VINTAGE]:
		"Faded mid-century travel-poster screenprint: limited matte palette on aged cream (#f8f0d7) with sage accents (#8a9a72), flat paper texture and gentle foxing, even daylight.",
	[SiteTheme.MEDITERRANEAN]:
		"Sunlit Mediterranean gouache: chalky whitewash ground (#fdf9ec), deep sea-blue accents (#1d4f91), lemon and olive greens, high bright midday sun and crisp shadows.",
};

/*
 * What the block is for, so a hero reads as a wide establishing scene and a guide card as a small
 * object study. The model gets the intent; `illustrationAspectRatio` gets the frame.
 */
const placementBriefs: Record<IllustrationPlacement, string> = {
	hero: "A wide establishing scene setting the mood for the whole wedding website.",
	story: "A small intimate vignette illustrating one moment in the couple's story.",
	gallery: "A decorative scene that sits alongside the couple's own photographs.",
	guideSection: "A wide banner for a section of a destination guide.",
	guideItem: "A single clear subject for a small guide card: one place, dish or object.",
};

const placementAspectRatios: Record<IllustrationPlacement, string> = {
	hero: "16:9",
	story: "4:3",
	gallery: "1:1",
	guideSection: "16:9",
	guideItem: "3:2",
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
 */
const RULES = [
	"No text, letters, numbers, captions, signatures or watermarks anywhere in the image.",
	"No recognisable faces: any people are small, turned away, or suggested in a few strokes.",
	"No borders, frames, mockups or drop shadows — the artwork fills the frame edge to edge.",
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
