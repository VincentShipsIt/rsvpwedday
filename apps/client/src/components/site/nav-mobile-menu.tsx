"use client";

import Link from "next/link";
import { useState } from "react";
import type { SiteLink } from "@/lib/site-links";

// Isolated from `SiteNav` (a server component) so only this toggle needs client state; the
// link list itself still comes from server-rendered data, just rendered twice — inline at
// `lg:` and up, behind this toggle below `lg` — rather than making the whole nav a client tree.
export function NavMobileMenu({
	links,
	linkClassName,
}: {
	links: SiteLink[];
	linkClassName: string;
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="relative lg:hidden">
			<button
				type="button"
				aria-expanded={isOpen}
				aria-label="Menu"
				onClick={() => setIsOpen((current) => !current)}
				className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-1.5"
			>
				<span className="h-0.5 w-5 bg-current" />
				<span className="h-0.5 w-5 bg-current" />
				<span className="h-0.5 w-5 bg-current" />
			</button>
			{/* Plain conditional render, no open/close transition, so this stays
			    reduced-motion-safe without needing its own media-query gate. */}
			{isOpen && (
				<div className="absolute top-full right-0 z-30 mt-2 flex min-w-40 flex-col gap-1 rounded-md border border-ink/10 bg-ivory p-2 text-ink shadow-md">
					{links.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							onClick={() => setIsOpen(false)}
							className={`flex min-h-11 items-center rounded px-3 hover:text-green ${linkClassName}`}
						>
							{link.label}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
