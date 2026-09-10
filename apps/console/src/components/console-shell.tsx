import { Button } from "@rsvpwedday/ui/button";
import Link from "next/link";
import type { ReactNode } from "react";

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
			<aside className="flex w-56 shrink-0 flex-col border-r bg-muted/40 px-3 py-6 pb-16">
				<p className="px-2 font-display text-lg tracking-tight">Say Yes</p>
				<p className="text-muted-foreground mt-1 px-2 text-xs">Planning console</p>
				<nav aria-label="Console" className="mt-10 flex flex-col gap-1">
					{NAV.map((item) => (
						<Button
							key={item.href}
							variant={active === item.href ? "secondary" : "ghost"}
							size="sm"
							className="w-full justify-start"
							asChild
						>
							<Link href={item.href} aria-current={active === item.href ? "page" : undefined}>
								{item.label}
							</Link>
						</Button>
					))}
				</nav>
				<p className="text-muted-foreground mt-auto px-2 text-xs">
					Guest sites stay on their own domain.
				</p>
			</aside>
			<main className="min-w-0 flex-1 p-8">{children}</main>
		</div>
	);
}
