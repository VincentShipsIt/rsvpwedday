import Image from "next/image";
import { Card } from "@/components/card";
import { Reveal } from "@/components/site/reveal";
import { RichText } from "@/components/site/rich-text";
import { type BlockItemView, cardHasContent } from "@/lib/page-content";

function staggerDelay(index: number): number {
	return Math.min(index * 80, 400);
}

// A heading, an intro and a grid of cards — the shape the travel guide's sections had, now
// available on any page. One layout for every theme, driven by the theme tokens rather than seven
// variants: this is reference material a guest comes back to, so it stays plainer than the hero.
export function CardsBlock({
	anchor,
	heading,
	body,
	imageUrl,
	items,
	linkLabel,
	isFirst,
}: {
	anchor: string;
	heading: string;
	body: string;
	imageUrl: string | null;
	items: BlockItemView[];
	linkLabel: string;
	/** The first block's photo is the page's LCP, so it loads eagerly like the hero. */
	isFirst: boolean;
}) {
	const visibleItems = items.filter(cardHasContent);
	return (
		<section
			id={anchor || undefined}
			className="mx-auto flex max-w-6xl scroll-mt-[var(--wed-nav-height)] flex-col gap-8 px-6 py-16"
		>
			{imageUrl && (
				<Reveal className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl">
					<Image
						src={imageUrl}
						alt=""
						fill
						sizes="(min-width: 1152px) 72rem, 100vw"
						priority={isFirst}
						className="object-cover"
					/>
				</Reveal>
			)}
			{(heading || body) && (
				<Reveal className="flex flex-col gap-3">
					{heading && <h2 className="text-3xl font-medium sm:text-4xl">{heading}</h2>}
					<RichText html={body} className="max-w-3xl text-ink/70" />
				</Reveal>
			)}
			{visibleItems.length > 0 && (
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{visibleItems.map((item, index) => (
						<Reveal key={item.id} delay={staggerDelay(index)}>
							<Card className="hover-lift flex h-full flex-col gap-3">
								{item.imageUrl && (
									<div className="relative -mx-6 -mt-6 mb-1 aspect-[4/3] overflow-hidden rounded-t-xl">
										<Image
											src={item.imageUrl}
											alt=""
											fill
											sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
											className="object-cover"
										/>
									</div>
								)}
								{item.title && <h3 className="text-xl">{item.title}</h3>}
								<RichText html={item.body} className="text-sm text-ink/70" />
								{item.url && (
									<a
										href={item.url}
										target="_blank"
										rel="noreferrer"
										className="link-underline mt-auto pt-2 text-sm text-green"
									>
										{linkLabel}
									</a>
								)}
							</Card>
						</Reveal>
					))}
				</div>
			)}
		</section>
	);
}
