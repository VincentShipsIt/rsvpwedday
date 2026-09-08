"use client";

import {
	CameraIcon,
	FileTextIcon,
	GiftIcon,
	LayoutDashboardIcon,
	LogOutIcon,
	MailIcon,
	PanelLeftCloseIcon,
	PanelLeftOpenIcon,
	SettingsIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { SETTINGS_SECTIONS } from "@/app/admin/settings/sections";
import { cn } from "@/lib/utils";

const COLLAPSED_STORAGE_KEY = "wed:admin-sidebar-collapsed";

const NAV_ITEMS = [
	{ href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
	{ href: "/admin/guests", label: "Guests", icon: UsersIcon },
	{ href: "/admin/pages", label: "Pages", icon: FileTextIcon },
	{ href: "/admin/emails", label: "Emails", icon: MailIcon },
	{ href: "/admin/gifts", label: "Wish list", icon: GiftIcon },
	{ href: "/admin/memories", label: "Memories", icon: CameraIcon },
	{ href: "/admin/settings", label: "Settings", icon: SettingsIcon, children: SETTINGS_SECTIONS },
] as const;

function isActive(pathname: string, href: string): boolean {
	return href === "/admin"
		? pathname === href
		: pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
	href,
	active,
	nested = false,
	collapsed = false,
	title,
	children,
}: {
	href: string;
	active: boolean;
	nested?: boolean;
	/** Icons only: the row centres its icon and the label is left to the tooltip. */
	collapsed?: boolean;
	title?: string;
	children: ReactNode;
}) {
	return (
		<Link
			href={href}
			aria-current={active ? "page" : undefined}
			title={collapsed ? title : undefined}
			className={cn(
				"flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
				nested && "ml-6 py-1",
				collapsed && "justify-center px-0",
				active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground"
			)}
		>
			{children}
		</Link>
	);
}

/*
 * Remembers whether the sidebar is collapsed, per browser. It starts expanded on the server and on
 * the first paint and only narrows once the stored value has been read, because rendering the
 * collapsed width during SSR would not match what the browser has stored and React would complain.
 */
function useSidebarCollapsed(): [boolean, () => void] {
	const [isCollapsed, setIsCollapsed] = useState(false);

	useEffect(() => {
		try {
			setIsCollapsed(window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1");
		} catch {
			// A browser refusing storage just means the sidebar forgets between visits.
		}
	}, []);

	function toggle() {
		setIsCollapsed((current) => {
			const next = !current;
			try {
				window.localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0");
			} catch {
				// Same again: the toggle still works, it just does not persist.
			}
			return next;
		});
	}

	return [isCollapsed, toggle];
}

// Sidebar navigation for every authenticated `/admin` page. The Settings entry expands into its
// per-section links whenever a settings page is open, so the section tabs that used to sit above
// each form live here instead. `logout` is passed in because a client component cannot import a
// server action module that also touches the database at import time.
export function AdminSidebar({ logout }: { logout: () => Promise<void> }) {
	const pathname = usePathname();
	const [isCollapsed, toggleCollapsed] = useSidebarCollapsed();

	return (
		<aside
			className={cn(
				"sticky top-0 flex h-dvh shrink-0 flex-col overflow-y-auto border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 max-md:hidden",
				isCollapsed ? "w-16" : "w-56"
			)}
		>
			<div
				className={cn("flex items-center gap-2 py-5", isCollapsed ? "justify-center px-3" : "px-5")}
			>
				{!isCollapsed && (
					<Link href="/admin" className="min-w-0 flex-1 truncate font-display text-lg">
						Wedding admin
					</Link>
				)}
				<button
					type="button"
					onClick={toggleCollapsed}
					aria-label={isCollapsed ? "Expand the sidebar" : "Collapse the sidebar"}
					aria-expanded={!isCollapsed}
					title={isCollapsed ? "Expand the sidebar" : "Collapse the sidebar"}
					className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
				>
					{isCollapsed ? (
						<PanelLeftOpenIcon className="size-4" aria-hidden="true" />
					) : (
						<PanelLeftCloseIcon className="size-4" aria-hidden="true" />
					)}
				</button>
			</div>
			<nav className="flex flex-1 flex-col gap-0.5 px-3">
				{NAV_ITEMS.map((item) => {
					const active = isActive(pathname, item.href);
					const Icon = item.icon;
					return (
						<div key={item.href} className="flex flex-col gap-0.5">
							<NavLink href={item.href} active={active} collapsed={isCollapsed} title={item.label}>
								<Icon className="size-4 shrink-0" aria-hidden="true" />
								{!isCollapsed && item.label}
							</NavLink>
							{/* Collapsed, there is no room for the settings sub-list; the Settings page
							    itself still lists all four. */}
							{"children" in item &&
								active &&
								!isCollapsed &&
								item.children.map((section) => (
									<NavLink
										key={section.href}
										href={section.href}
										active={pathname === section.href}
										nested
									>
										{section.label}
									</NavLink>
								))}
						</div>
					);
				})}
			</nav>
			<form action={logout} className="border-t px-3 py-3">
				<button
					type="submit"
					title={isCollapsed ? "Log out" : undefined}
					className={cn(
						"flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
						isCollapsed && "justify-center px-0"
					)}
				>
					<LogOutIcon className="size-4 shrink-0" aria-hidden="true" />
					{!isCollapsed && "Log out"}
				</button>
			</form>
		</aside>
	);
}

// Compact top bar for viewports too narrow for the sidebar: the same links in a scrollable row.
export function AdminMobileNav() {
	const pathname = usePathname();
	const settingsOpen = isActive(pathname, "/admin/settings");

	return (
		<nav className="flex flex-col border-b md:hidden">
			<div className="flex gap-1 overflow-x-auto px-3 py-2">
				{NAV_ITEMS.map((item) => (
					<NavLink key={item.href} href={item.href} active={isActive(pathname, item.href)}>
						{item.label}
					</NavLink>
				))}
			</div>
			{settingsOpen && (
				<div className="flex gap-1 overflow-x-auto border-t px-3 py-2">
					{SETTINGS_SECTIONS.map((section) => (
						<NavLink key={section.href} href={section.href} active={pathname === section.href}>
							{section.label}
						</NavLink>
					))}
				</div>
			)}
		</nav>
	);
}
