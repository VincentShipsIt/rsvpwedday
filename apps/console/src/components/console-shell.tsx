import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const NAV = [
	{ href: "/", label: "Requests" },
	{ href: "/partners", label: "Partners" },
	{ href: "/agent", label: "Agent" },
] as const;

export function ConsoleShell({
	active,
	children,
}: {
	active: (typeof NAV)[number]["href"];
	children: ReactNode;
}) {
	return (
		<div className="flex min-h-dvh">
			<aside className="flex w-56 shrink-0 flex-col bg-ink px-4 py-6 pb-16 text-paper">
				<p className="px-2 font-display text-lg tracking-tight">Atelier Vero</p>
				<p className="mt-1 px-2 text-xs text-paper/50">Planning console</p>
				<nav aria-label="Console" className="mt-10 flex flex-col gap-1">
					{NAV.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							aria-current={active === item.href ? "page" : undefined}
							className={cn(
								"rounded-md px-2 py-1.5 text-sm transition-colors",
								active === item.href
									? "bg-paper/10 text-paper"
									: "text-paper/60 hover:bg-paper/5 hover:text-paper"
							)}
						>
							{item.label}
						</Link>
					))}
				</nav>
				<p className="mt-auto px-2 text-xs text-paper/40">Guest sites stay on their own domain.</p>
			</aside>
			<main className="min-w-0 flex-1 p-8">{children}</main>
		</div>
	);
}
