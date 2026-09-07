import { Reveal } from "@/components/site/reveal";

export type FaqEntryView = { id: string; question: string; answer: string };

function staggerDelay(index: number): number {
	return Math.min(index * 80, 400);
}

// Native `<details>` accordion: keyboard- and screen-reader-accessible with no client state, and
// it degrades to plain open text without JavaScript. Styled from the theme tokens only, so every
// theme shares this one layout the way `RsvpSection` does.
export function Faq({ heading, entries }: { heading: string; entries: FaqEntryView[] }) {
	if (entries.length === 0) {
		return null;
	}

	return (
		<section
			id="faq"
			className="mx-auto flex max-w-2xl scroll-mt-[var(--wed-nav-height)] flex-col gap-10 px-6 py-24"
		>
			<Reveal className="text-center">
				<h2 className="text-4xl font-medium sm:text-5xl">{heading}</h2>
			</Reveal>
			<div className="divide-y divide-ink/10 border-y border-ink/10">
				{entries.map((entry, index) => (
					<Reveal key={entry.id} delay={staggerDelay(index)}>
						<details className="group py-4">
							<summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg [&::-webkit-details-marker]:hidden">
								<span>{entry.question}</span>
								<svg
									aria-hidden="true"
									viewBox="0 0 20 20"
									className="h-4 w-4 shrink-0 text-green transition-transform group-open:rotate-180"
								>
									<path
										fill="currentColor"
										d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.23 8.29a.75.75 0 0 1 0-1.08Z"
									/>
								</svg>
							</summary>
							<p className="whitespace-pre-line pt-3 text-ink/70">{entry.answer}</p>
						</details>
					</Reveal>
				))}
			</div>
		</section>
	);
}
