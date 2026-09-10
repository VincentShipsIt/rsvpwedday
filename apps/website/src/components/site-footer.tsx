import { studio } from "@/lib/brand";

export function SiteFooter() {
	return (
		<footer className="border-t border-ink/12 px-6 py-10 md:px-12">
			<div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-5">
				<p className="display-sm text-xl">{studio.name}</p>
				<nav
					aria-label="Footer"
					className="flex flex-wrap gap-x-7 gap-y-2 text-[10px] font-medium tracking-[0.2em] text-ink-soft uppercase"
				>
					<a href="/prestations" className="transition-colors hover:text-ink">
						Prestations
					</a>
					<a href="/pricing" className="transition-colors hover:text-ink">
						Pricing
					</a>
					<a href={`mailto:${studio.enquiryEmail}`} className="transition-colors hover:text-ink">
						{studio.enquiryEmail}
					</a>
				</nav>
				<p className="text-[10px] font-medium tracking-[0.2em] text-ink-soft uppercase">
					{studio.place}
				</p>
			</div>
		</footer>
	);
}
