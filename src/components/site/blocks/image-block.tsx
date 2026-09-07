import Image from "next/image";
import { Reveal } from "@/components/site/reveal";

// One wide photo with an optional caption, for a picture that needs to breathe between two
// blocks of copy rather than join the gallery grid.
export function ImageBlock({
	imageUrl,
	caption,
	isFirst,
}: {
	imageUrl: string;
	caption: string;
	isFirst: boolean;
}) {
	return (
		<section className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-12">
			<Reveal className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
				<Image
					src={imageUrl}
					alt={caption}
					fill
					sizes="(min-width: 1024px) 64rem, 100vw"
					priority={isFirst}
					className="object-cover"
				/>
			</Reveal>
			{caption && <p className="text-center text-sm text-ink/60">{caption}</p>}
		</section>
	);
}
