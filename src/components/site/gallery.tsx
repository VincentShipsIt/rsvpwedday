import Image from "next/image";
import { Parallax } from "@/components/site/parallax";
import { Reveal } from "@/components/site/reveal";
import { SiteTheme } from "@/generated/prisma/enums";

const wrapperClassNames: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4",
	[SiteTheme.MODERN]: "grid grid-cols-2 gap-1 sm:grid-cols-3",
	[SiteTheme.GARDEN]: "columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6",
	// Single column below `sm` per the Part 3 mobile pass, even though the desktop spec calls
	// for a 2-column grid (the brief's mobile-single-column requirement applies to these two new
	// themes without the "leave shipped Modern as-is" caveat given for Modern's gallery).
	[SiteTheme.MIDNIGHT]: "grid grid-cols-1 gap-3 sm:grid-cols-2",
	[SiteTheme.BOHO]: "grid grid-cols-1 gap-4 sm:grid-cols-2",
	[SiteTheme.VINTAGE]: "columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6",
	[SiteTheme.MEDITERRANEAN]: "columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5",
};

const imageWrapperClassNames: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "overflow-hidden rounded-lg",
	[SiteTheme.MODERN]: "overflow-hidden",
	[SiteTheme.GARDEN]: "overflow-hidden rounded-3xl",
	[SiteTheme.MIDNIGHT]: "overflow-hidden ring-1 ring-green/40",
	[SiteTheme.BOHO]: "overflow-hidden rounded-3xl",
	// A warm paper mat around each photo: padding plus the ivory ground shows as a border, like a
	// picture frame's mat board.
	[SiteTheme.VINTAGE]: "overflow-hidden border border-ink/10 bg-ivory p-2 shadow-sm",
	// A white postcard mat with a Mediterranean-blue hairline, like a framed print on a whitewashed wall.
	[SiteTheme.MEDITERRANEAN]:
		"overflow-hidden rounded-lg border border-green/25 bg-white p-2 shadow-sm",
};

// Matches each theme's actual rendered column count per breakpoint (see `wrapperClassNames`
// above) rather than one shared guess: editorial/garden/vintage/mediterranean stay 3-up from `lg`, modern goes
// 3-up already at `sm`, and midnight/boho never pass 2-up.
const imageSizes: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
	[SiteTheme.MODERN]: "(min-width: 640px) 33vw, 50vw",
	[SiteTheme.GARDEN]: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
	[SiteTheme.MIDNIGHT]: "(min-width: 640px) 50vw, 100vw",
	[SiteTheme.BOHO]: "(min-width: 640px) 50vw, 100vw",
	[SiteTheme.VINTAGE]: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
	[SiteTheme.MEDITERRANEAN]: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
};

export function Gallery({
	heading,
	imageUrls,
	theme,
}: {
	heading: string;
	imageUrls: string[];
	theme: SiteTheme;
}) {
	if (imageUrls.length === 0) {
		return null;
	}

	const isModern = theme === SiteTheme.MODERN;

	return (
		<section
			id="gallery"
			className="mx-auto flex max-w-6xl scroll-mt-[var(--wed-nav-height)] flex-col gap-12 px-6 py-24"
		>
			<Reveal className="text-center">
				<h2 className="text-4xl font-medium sm:text-5xl">{heading}</h2>
			</Reveal>
			<div className={wrapperClassNames[theme]}>
				{imageUrls.map((url, index) => (
					<Reveal key={url} delay={Math.min(index * 80, 400)} variant="scale">
						{/* Only Modern's tiles are a fixed aspect-square frame with `object-cover`;
						    the other themes deliberately keep each image's natural aspect ratio
						    (masonry columns), which has no fixed frame for `Parallax`'s oversized
						    `fill` image to overflow within, so parallax is scoped to Modern here. */}
						{isModern ? (
							<Parallax
								factor={0.12}
								className={`aspect-square ${imageWrapperClassNames[theme]} hover-lift hover-zoom-img`}
							>
								<Image src={url} alt="" fill sizes={imageSizes[theme]} className="object-cover" />
							</Parallax>
						) : (
							<div className={`${imageWrapperClassNames[theme]} hover-lift hover-zoom-img`}>
								<Image
									src={url}
									alt=""
									width={640}
									height={800}
									sizes={imageSizes[theme]}
									className="h-auto w-full"
								/>
							</div>
						)}
					</Reveal>
				))}
			</div>
		</section>
	);
}
