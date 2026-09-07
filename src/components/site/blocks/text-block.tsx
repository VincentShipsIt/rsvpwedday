import { Reveal } from "@/components/site/reveal";
import { RichText } from "@/components/site/rich-text";

// A free text block: an optional heading over admin-authored rich text. Deliberately the plainest
// block on the site — it is the one the couple reaches for when no other block fits, so it stays
// out of the way of whatever sits above and below it.
export function TextBlock({
	anchor,
	heading,
	body,
}: {
	anchor: string;
	heading: string;
	body: string;
}) {
	return (
		<section
			id={anchor || undefined}
			className="mx-auto flex max-w-3xl scroll-mt-[var(--wed-nav-height)] flex-col gap-6 px-6 py-20"
		>
			{heading && (
				<Reveal className="text-center">
					<h2 className="text-4xl font-medium sm:text-5xl">{heading}</h2>
				</Reveal>
			)}
			<Reveal>
				<RichText html={body} className="text-ink/70" />
			</Reveal>
		</section>
	);
}
