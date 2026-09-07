import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import { RichText } from "@/components/site/rich-text";

// A card that sends a guest to another page — what the travel-guide teaser used to be, now
// pointing wherever the couple aims it. Typically placed right after Events: a guest has just
// read where the ceremony is, and "how do I get there" is the next question.
export function PageLinkBlock({
	href,
	title,
	body,
	imageUrl,
	ctaLabel,
}: {
	href: string;
	title: string;
	body: string;
	imageUrl: string | null;
	ctaLabel: string;
}) {
	return (
		<section className="mx-auto max-w-4xl px-6 py-16">
			<Reveal>
				<div className="flex flex-col items-center gap-8 rounded-2xl border border-ink/10 bg-ivory-dark/60 p-8 text-center sm:flex-row sm:text-left">
					{imageUrl && (
						<div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl sm:w-56">
							<Image
								src={imageUrl}
								alt=""
								fill
								sizes="(min-width: 640px) 14rem, 100vw"
								className="object-cover"
							/>
						</div>
					)}
					<div className="flex flex-col items-center gap-4 sm:items-start">
						{title && <h2 className="text-3xl font-medium">{title}</h2>}
						<RichText html={body} className="max-w-xl text-ink/70" />
						<Link
							href={href}
							className="inline-flex rounded-md bg-green px-5 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-green-dark"
						>
							{ctaLabel}
						</Link>
					</div>
				</div>
			</Reveal>
		</section>
	);
}
