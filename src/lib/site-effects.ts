import { OpeningAnimation } from "@/generated/prisma/enums";

const openingParams: Record<string, OpeningAnimation> = {
	none: OpeningAnimation.NONE,
	seal: OpeningAnimation.SEAL,
	monogram: OpeningAnimation.MONOGRAM,
	bloom: OpeningAnimation.BLOOM,
	mediterranean: OpeningAnimation.MEDITERRANEAN_BLOOM,
};

// The landing page accepts `?opening=` alongside `?theme=` so every cover animation can be
// compared by URL; the stored `siteContent.openingAnimation` is what guests get.
export function resolveOpeningAnimation(
	openingParam: string | undefined,
	storedOpening: OpeningAnimation
): OpeningAnimation {
	if (openingParam && Object.hasOwn(openingParams, openingParam)) {
		return openingParams[openingParam];
	}

	return storedOpening;
}

// Same shape as `themeChoices` in `site-theme.ts`: the `?opening=` key next to the enum and a
// label/description for the admin's Effects page.
export const openingChoices: {
	key: string;
	opening: OpeningAnimation;
	label: string;
	description: string;
}[] = [
	{
		key: "mediterranean",
		opening: OpeningAnimation.MEDITERRANEAN_BLOOM,
		label: "Mediterranean Bloom",
		description:
			"An embossed cream envelope opens in a short film, with a blue wax seal and lemon details. Designed for the Mediterranean palette.",
	},
	{
		key: "bloom",
		opening: OpeningAnimation.BLOOM,
		label: "Bloom",
		description:
			"Botanical branches grow and blossom around your names; petals fly as the cover splits open.",
	},
	{
		key: "seal",
		opening: OpeningAnimation.SEAL,
		label: "Wax seal",
		description:
			"A botanical envelope: the seal releases, the flap lifts, and a card reveals your names.",
	},
	{
		key: "monogram",
		opening: OpeningAnimation.MONOGRAM,
		label: "Monogram",
		description: "Your initials are hand-drawn inside a turning ring, then the cover splits open.",
	},
	{
		key: "none",
		opening: OpeningAnimation.NONE,
		label: "No cover",
		description: "Guests land straight on the page.",
	},
];

// `data-opening` value on the cover's root, which the phase-driven CSS in `globals.css` keys on.
export const dataOpening: Record<OpeningAnimation, string> = {
	[OpeningAnimation.NONE]: "none",
	[OpeningAnimation.SEAL]: "seal",
	[OpeningAnimation.MONOGRAM]: "monogram",
	[OpeningAnimation.BLOOM]: "bloom",
	[OpeningAnimation.MEDITERRANEAN_BLOOM]: "mediterranean",
};
