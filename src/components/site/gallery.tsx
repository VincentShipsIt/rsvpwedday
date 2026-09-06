import Image from "next/image";
import { Reveal } from "@/components/site/reveal";
import { SiteTheme } from "@/generated/prisma/enums";

const wrapperClassNames: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4",
	[SiteTheme.MODERN]: "grid grid-cols-2 gap-1 sm:grid-cols-3",
	[SiteTheme.GARDEN]: "columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6",
};

const imageWrapperClassNames: Record<SiteTheme, string> = {
	[SiteTheme.EDITORIAL]: "overflow-hidden rounded-lg",
	[SiteTheme.MODERN]: "overflow-hidden",
	[SiteTheme.GARDEN]: "overflow-hidden rounded-3xl",
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
							sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
							className={isModern ? "aspect-square h-full w-full object-cover" : "h-auto w-full"}
						/>
					</div>
				))}
			</Reveal>
		</section>
	);
}
