import { studio } from "@/lib/brand";

const links = [
	{ href: "/#site", label: "The site" },
	{ href: "/prestations", label: "Prestations" },
	{ href: "/pricing", label: "Pricing" },
	{ href: "/#enquire", label: "Enquire" },
] as const;

export function SiteHeader({ invert = false }: { invert?: boolean }) {
	return (
		<header className="relative z-10 flex items-end justify-between gap-6 px-6 py-6 md:px-12">
			<a
				href="/"
				className={
					invert
						? "font-display text-xl font-semibold tracking-tight text-paper"
						: "font-display text-xl font-semibold tracking-tight text-ink"
				}
			>
				{studio.name}
			</a>
			<nav aria-label="Primary" className="flex flex-wrap justify-end gap-x-6 gap-y-2 text-sm">
				{links.map((link) => (
					<a
						key={link.href}
						href={link.href}
						className={
							invert
								? "text-paper/80 transition-colors hover:text-saffron"
								: "text-ink-soft transition-colors hover:text-saffron"
						}
					>
						{link.label}
					</a>
				))}
			</nav>
		</header>
	);
}
