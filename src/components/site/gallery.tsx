import Image from "next/image";
import { Reveal } from "@/components/site/reveal";

export function Gallery({ heading, imageUrls }: { heading: string; imageUrls: string[] }) {
	if (imageUrls.length === 0) {
		return null;
	}

	return (
		<section id="gallery" className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-24">
			<Reveal className="text-center">
				<h2 className="text-4xl font-medium sm:text-5xl">{heading}</h2>
			</Reveal>
			<Reveal className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
				{imageUrls.map((url) => (
					<div key={url} className="overflow-hidden rounded-lg">
						<Image
							src={url}
							alt=""
							width={640}
							height={800}
							sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
							className="h-auto w-full"
						/>
					</div>
				))}
			</Reveal>
		</section>
	);
}
