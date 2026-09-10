import { studio } from "@/lib/brand";

export function SiteFooter() {
	return (
		<footer className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 px-6 py-8 text-sm text-ink-soft md:px-12">
			<p>{studio.name}</p>
			<nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
				<a href="/prestations" className="hover:text-saffron">
					Prestations
				</a>
				<a href="/pricing" className="hover:text-saffron">
					Pricing
				</a>
				<a href={`mailto:${studio.enquiryEmail}`} className="hover:text-saffron">
					{studio.enquiryEmail}
				</a>
			</nav>
		</footer>
	);
}
