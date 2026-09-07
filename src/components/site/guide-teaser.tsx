import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";

// Sits right after the Events block on the home page: a guest has just read where the ceremony
// is, and "how do I get there, where do I sleep" is the next question. Links to `/guide`.
export function GuideTeaser({
	title,
	intro,
	imageUrl,
	ctaLabel,
}: {
	title: string;
	intro: string;
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
						<h2 className="text-3xl font-medium">{title}</h2>
						{intro && <p className="max-w-xl text-ink/70">{intro}</p>}
						<Link
							href="/guide"
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
