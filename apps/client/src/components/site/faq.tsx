import { FaqItem } from "@/components/site/faq-item";
import { Reveal } from "@/components/site/reveal";
import { RichText } from "@/components/site/rich-text";

export type FaqEntryView = { id: string; question: string; answer: string };

function staggerDelay(index: number): number {
	return Math.min(index * 80, 400);
}

// Native `<details>` accordion: keyboard- and screen-reader-accessible, and it degrades to plain
// open text without JavaScript. `FaqItem` adds the open/close height animation on top of that
// element rather than replacing it. Styled from the theme tokens only, so every theme shares this
// one layout the way `RsvpSection` does.
export function Faq({
	anchor,
	heading,
	entries,
}: {
	anchor: string;
	heading: string;
	entries: FaqEntryView[];
}) {
	if (entries.length === 0) {
		return null;
	}

	return (
		<section
			id={anchor || undefined}
			className="mx-auto flex max-w-2xl scroll-mt-[var(--wed-nav-height)] flex-col gap-10 px-6 py-24"
		>
			<Reveal className="text-center">
				<h2 className="text-4xl font-medium sm:text-5xl">{heading}</h2>
			</Reveal>
			<div className="divide-y divide-ink/10 border-y border-ink/10">
				{entries.map((entry, index) => (
					<Reveal key={entry.id} delay={staggerDelay(index)}>
						<FaqItem question={entry.question}>
							<RichText html={entry.answer} className="pt-3 text-ink/70" />
						</FaqItem>
					</Reveal>
				))}
			</div>
		</section>
	);
}
