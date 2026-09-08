"use client";

import {
	CameraIcon,
	FileTextIcon,
	GiftIcon,
	LayoutDashboardIcon,
	LogOutIcon,
	MailIcon,
	SettingsIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SETTINGS_SECTIONS } from "@/app/admin/settings/sections";
import { cn } from "@/lib/utils";

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
	children,
}: {
	href: string;
	active: boolean;
	nested?: boolean;
	children: ReactNode;
}) {
	return (
		<Link
			href={href}
			aria-current={active ? "page" : undefined}
			className={cn(
				"flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
				nested && "ml-6 py-1",
				active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground"
			)}
		>
			{children}
		</Link>
	);
}

// Sidebar navigation for every authenticated `/admin` page. The Settings entry expands into its
// per-section links whenever a settings page is open, so the section tabs that used to sit above
// each form live here instead. `logout` is passed in because a client component cannot import a
// server action module that also touches the database at import time.
export function AdminSidebar({ logout }: { logout: () => Promise<void> }) {
	const pathname = usePathname();

	return (
		<aside className="sticky top-0 flex h-dvh w-56 shrink-0 flex-col overflow-y-auto border-r bg-sidebar text-sidebar-foreground max-md:hidden">
			<div className="px-5 py-5">
				<Link href="/admin" className="font-display text-lg">
					Wedding admin
				</Link>
			</div>
			<nav className="flex flex-1 flex-col gap-0.5 px-3">
				{NAV_ITEMS.map((item) => {
					const active = isActive(pathname, item.href);
					const Icon = item.icon;
					return (
						<div key={item.href} className="flex flex-col gap-0.5">
							<NavLink href={item.href} active={active}>
								<Icon className="size-4" aria-hidden="true" />
								{item.label}
							</NavLink>
							{"children" in item &&
								active &&
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
					className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
				>
					<LogOutIcon className="size-4" aria-hidden="true" />
					Log out
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
