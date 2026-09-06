import Link from "next/link";
import type { Locale } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";

export function SiteNav({
	coupleNames,
	locale,
	labels,
}: {
	coupleNames: string;
	locale: Locale;
	labels: { story: string; events: string; gallery: string; rsvp: string };
}) {
	return (
		<header className="sticky top-0 z-20 border-b border-ink/10 bg-ivory/80 backdrop-blur">
			<nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 text-sm">
				<a href="#top" className="font-display text-lg">
					{coupleNames}
				</a>
				<div className="flex flex-wrap items-center gap-6">
					<a href="#story" className="hover:text-green">
						{labels.story}
					</a>
					<a href="#events" className="hover:text-green">
						{labels.events}
					</a>
					<a href="#gallery" className="hover:text-green">
						{labels.gallery}
					</a>
					<a href="#rsvp" className="hover:text-green">
						{labels.rsvp}
					</a>
					<div className="flex items-center gap-2">
						{localeCodes.map((code) => (
							<Link
								key={code}
								href={`/?lang=${code}#top`}
								className={
									code === locale ? "font-medium text-green" : "text-ink/60 hover:text-green"
								}
							>
								{locales[code].label}
							</Link>
						))}
					</div>
				</div>
			</nav>
		</header>
	);
}
