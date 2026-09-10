import {
	BotIcon,
	CalendarIcon,
	Columns3Icon,
	HandshakeIcon,
	HeartIcon,
	LineChartIcon,
	RadioIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
	{ href: "/", label: "Agent", icon: BotIcon },
	{ href: "/leads", label: "Leads", icon: Columns3Icon },
	{ href: "/clients", label: "Clients", icon: HeartIcon },
	{ href: "/providers", label: "Providers", icon: HandshakeIcon },
	{ href: "/calendar", label: "Calendar", icon: CalendarIcon },
	{ href: "/analytics", label: "Analytics", icon: LineChartIcon },
	{ href: "/social", label: "Social", icon: RadioIcon },
] as const;

function isActive(pathname: string, href: string): boolean {
	return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
	href,
	active,
	children,
}: {
	href: string;
	active: boolean;
	children: ReactNode;
}) {
	return (
		<Link
			href={href}
			aria-current={active ? "page" : undefined}
			className={cn(
				"flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
				active
					? "bg-sand font-medium text-ink"
					: "text-paper/70 hover:bg-sidebar-accent hover:text-paper"
			)}
		>
			{children}
		</Link>
	);
}

export function ConsoleShell({ pathname, children }: { pathname: string; children: ReactNode }) {
	return (
		<div className="flex min-h-dvh flex-col md:flex-row">
			<aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col overflow-y-auto bg-sidebar text-sidebar-foreground md:flex">
				<div className="px-5 py-5">
					<Link
						href="/"
						className="font-display block truncate text-lg font-semibold tracking-tight"
					>
						Say Yes
					</Link>
					<p className="mt-1 text-xs text-paper/50">Studio CRM</p>
				</div>
				<nav aria-label="Console" className="flex flex-1 flex-col gap-0.5 px-3">
					{NAV.map((item) => {
						const Icon = item.icon;
						return (
							<NavLink key={item.href} href={item.href} active={isActive(pathname, item.href)}>
								<Icon className="size-4 shrink-0" aria-hidden="true" />
								{item.label}
							</NavLink>
						);
					})}
				</nav>
				<p className="border-t border-paper/10 px-5 py-3 text-xs text-paper/50">
					Guest sites stay on their own domain.
				</p>
			</aside>
			<nav
				aria-label="Console"
				className="flex gap-1 overflow-x-auto border-b border-ink/10 bg-sidebar px-3 py-2 md:hidden"
			>
				{NAV.map((item) => (
					<NavLink key={item.href} href={item.href} active={isActive(pathname, item.href)}>
						{item.label}
					</NavLink>
				))}
			</nav>
			<main className="min-w-0 flex-1 bg-paper">
				<div className="mx-auto max-w-[96rem] px-6 py-10 lg:px-12">{children}</div>
			</main>
		</div>
	);
}
