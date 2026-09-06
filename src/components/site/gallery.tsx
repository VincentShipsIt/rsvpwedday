import Image from "next/image";
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
};

const imageWrapperClassNames: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "overflow-hidden rounded-lg",
	[SiteTheme.MODERN]: "overflow-hidden",
	[SiteTheme.GARDEN]: "overflow-hidden rounded-3xl",
	[SiteTheme.MIDNIGHT]: "overflow-hidden ring-1 ring-green/40",
	[SiteTheme.BOHO]: "overflow-hidden rounded-3xl",
};

// Matches each theme's actual rendered column count per breakpoint (see `wrapperClassNames`
// above) rather than one shared guess: editorial/garden stay 3-up from `lg`, modern goes 3-up
// already at `sm`, and midnight/boho never pass 2-up.
const imageSizes: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
	[SiteTheme.MODERN]: "(min-width: 640px) 33vw, 50vw",
	[SiteTheme.GARDEN]: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
	[SiteTheme.MIDNIGHT]: "(min-width: 640px) 50vw, 100vw",
	[SiteTheme.BOHO]: "(min-width: 640px) 50vw, 100vw",
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
			<Reveal className={wrapperClassNames[theme]}>
				{imageUrls.map((url) => (
					<div key={url} className={imageWrapperClassNames[theme]}>
						<Image
							src={url}
							alt=""
							width={640}
							height={isModern ? 640 : 800}
							sizes={imageSizes[theme]}
							className={isModern ? "aspect-square h-full w-full object-cover" : "h-auto w-full"}
						/>
					</div>
				))}
			</Reveal>
		</section>
	);
}
