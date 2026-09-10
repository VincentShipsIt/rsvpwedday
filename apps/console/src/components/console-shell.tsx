import {
	CalendarIcon,
	HandshakeIcon,
	HeartIcon,
	HomeIcon,
	InboxIcon,
	LineChartIcon,
	type LucideIcon,
	RadioIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AgentToggle, RailProvider, RightRail } from "@/components/right-rail";
import { cn } from "@/lib/utils";

/*
 * Grouped the way the studio actually thinks about the work: what you open
 * every morning, the records you keep, and the numbers you check now and then.
 * A flat list of eight was fine at five and stopped scanning at eight.
 */
type NavItem = { href: string; label: string; icon: LucideIcon };
type NavSection = { label: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
	{
		label: "Workspace",
		items: [
			{ href: "/", label: "Home", icon: HomeIcon },
			{ href: "/inbox", label: "Inbox", icon: InboxIcon },
			{ href: "/calendar", label: "Calendar", icon: CalendarIcon },
		],
	},
	{
		label: "Records",
		items: [
			{ href: "/couples", label: "Couples", icon: HeartIcon },
			{ href: "/providers", label: "Providers", icon: HandshakeIcon },
		],
	},
	{
		label: "Insight",
		items: [
			{ href: "/analytics", label: "Analytics", icon: LineChartIcon },
			{ href: "/social", label: "Social", icon: RadioIcon },
		],
	},
];

const ALL_ITEMS = SECTIONS.flatMap((section) => section.items);

function isActive(pathname: string, href: string): boolean {
	return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/* "Records / Providers" — the sidebar grouping is the breadcrumb's first crumb,
   so the bar always says where in the workspace you are, not just what page. */
function crumbs(pathname: string): string[] {
	for (const section of SECTIONS) {
		const item = section.items.find((entry) => isActive(pathname, entry.href));
		if (item) return item.href === "/" ? [item.label] : [section.label, item.label];
	}
	return ["Studio"];
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
				"flex items-center gap-2 rounded-md px-2 py-1 text-[13px] transition-colors",
				active
					? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
					: "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
			)}
		>
			{children}
		</Link>
	);
}

export function ConsoleShell({
	pathname,
	children,
	fill = false,
}: {
	pathname: string;
	children: ReactNode;
	fill?: boolean;
}) {
	const trail = crumbs(pathname);

	return (
		<RailProvider>
			<div className="flex min-h-dvh flex-col md:flex-row">
				<aside className="bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto border-r md:flex">
					<div className="px-3 py-3">
						<Link
							href="/"
							className="hover:bg-sidebar-accent flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
						>
							<span className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded text-[11px] font-semibold">
								Y
							</span>
							<span className="truncate text-[13px] font-medium">Say Yes</span>
						</Link>
					</div>
					<nav aria-label="Console" className="flex flex-1 flex-col gap-5 px-3 pb-4">
						{SECTIONS.map((section) => (
							<div key={section.label} className="flex flex-col gap-0.5">
								<p className="text-muted-foreground px-2 pb-1 text-[11px] font-medium">
									{section.label}
								</p>
								{section.items.map((item) => {
									const Icon = item.icon;
									return (
										<NavLink
											key={item.href}
											href={item.href}
											active={isActive(pathname, item.href)}
										>
											<Icon className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
											{item.label}
										</NavLink>
									);
								})}
							</div>
						))}
					</nav>
				</aside>

				<nav
					aria-label="Console"
					className="bg-sidebar flex gap-1 overflow-x-auto border-b px-3 py-2 md:hidden"
				>
					{ALL_ITEMS.map((item) => (
						<NavLink key={item.href} href={item.href} active={isActive(pathname, item.href)}>
							{item.label}
						</NavLink>
					))}
				</nav>

				<div className="flex min-w-0 flex-1 flex-col md:h-dvh md:flex-row">
					<main className={cn("flex min-w-0 flex-1 flex-col", fill && "min-h-0 md:h-dvh")}>
						<header className="flex h-11 shrink-0 items-center gap-2 border-b px-4 lg:px-6">
							<nav aria-label="Breadcrumb" className="min-w-0">
								<ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
									{trail.map((crumb, index) => (
										<li key={crumb} className="flex min-w-0 items-center gap-1.5">
											{index > 0 ? (
												<span className="text-muted-foreground/60" aria-hidden="true">
													/
												</span>
											) : null}
											<span
												className={
													index === trail.length - 1
														? "truncate font-medium"
														: "text-muted-foreground truncate"
												}
												aria-current={index === trail.length - 1 ? "page" : undefined}
											>
												{crumb}
											</span>
										</li>
									))}
								</ol>
							</nav>
							<div className="ml-auto shrink-0">
								<AgentToggle />
							</div>
						</header>
						<div
							className={cn(
								fill
									? "flex min-h-0 flex-1 flex-col"
									: "min-h-0 flex-1 overflow-y-auto px-6 py-8 lg:px-10"
							)}
						>
							{children}
						</div>
					</main>
					<RightRail />
				</div>
			</div>
		</RailProvider>
	);
}
