import { studio } from "@/lib/brand";

const links = [
	{ href: "/#hold", label: "What we hold" },
	{ href: "/prestations", label: "Prestations" },
	{ href: "/pricing", label: "Pricing" },
	{ href: "/#enquire", label: "Enquire" },
] as const;

export function SiteHeader({ invert = false }: { invert?: boolean }) {
	return (
		<header className="relative z-10 flex items-center justify-between gap-6 px-6 py-7 md:px-12">
			<a href="/" className={`display-sm text-[22px] ${invert ? "text-ivory" : "text-ink"}`}>
				{studio.name}
			</a>
			<nav
				aria-label="Primary"
				className="flex flex-wrap justify-end gap-x-7 gap-y-2 text-[10px] font-medium tracking-[0.2em] uppercase"
			>
				{links.map((link) => (
					<a
						key={link.href}
						href={link.href}
						className={
							invert
								? "text-ivory/65 transition-colors hover:text-ivory"
								: "text-ink-soft transition-colors hover:text-ink"
						}
					>
						{link.label}
					</a>
				))}
			</nav>
		</header>
	);
}
