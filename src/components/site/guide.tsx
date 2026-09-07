import Image from "next/image";
import { Card } from "@/components/card";
import { Reveal } from "@/components/site/reveal";
import type { GuideSectionView } from "@/lib/guide-content";

function staggerDelay(index: number): number {
	return Math.min(index * 80, 400);
}

// The `/guide` page body. One layout for every theme, driven by the theme tokens (`ivory`,
// `ink`, `green`, the fonts) rather than six variants: this page is reference material guests
// come back to, so it stays plainer than the home page's themed sections.
export function Guide({
	title,
	intro,
	sections,
	linkLabel,
}: {
	title: string;
	intro: string;
	sections: GuideSectionView[];
	linkLabel: string;
}) {
	return (
		<article className="mx-auto flex max-w-6xl flex-col gap-20 px-6 py-24">
			<Reveal className="flex flex-col items-center gap-6 text-center">
				<h1 className="font-accent text-[clamp(2.5rem,7vw,4.5rem)] font-medium">{title}</h1>
				{intro && <p className="max-w-2xl whitespace-pre-line text-ink/70">{intro}</p>}
				{sections.length > 1 && (
					<nav className="flex flex-wrap justify-center gap-2 pt-2">
						{sections.map((section) => (
							<a
								key={section.id}
								href={`#${section.slug}`}
								className="rounded-full border border-ink/15 px-4 py-1.5 text-sm transition-colors hover:border-green hover:text-green"
							>
								{section.title}
							</a>
						))}
					</nav>
				)}
			</Reveal>

			{sections.map((section, sectionIndex) => (
				<section
					key={section.id}
					id={section.slug}
					className="flex scroll-mt-[var(--wed-nav-height)] flex-col gap-8"
				>
					{section.imageUrl && (
						<Reveal className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl">
							<Image
								src={section.imageUrl}
								alt=""
								fill
								sizes="(min-width: 1152px) 72rem, 100vw"
								// The first section's photo is the page's largest above-the-fold element
								// (its LCP), so it loads eagerly like the hero photo on the home page.
								priority={sectionIndex === 0}
								className="object-cover"
							/>
						</Reveal>
					)}
					<Reveal className="flex flex-col gap-3">
						<h2 className="text-3xl font-medium sm:text-4xl">{section.title}</h2>
						{section.intro && (
							<p className="max-w-3xl whitespace-pre-line text-ink/70">{section.intro}</p>
						)}
					</Reveal>
					{section.items.length > 0 && (
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{section.items.map((item, index) => (
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
										<h3 className="text-xl">{item.title}</h3>
										{item.body && (
											<p className="whitespace-pre-line text-sm text-ink/70">{item.body}</p>
										)}
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
			))}
		</article>
	);
}
