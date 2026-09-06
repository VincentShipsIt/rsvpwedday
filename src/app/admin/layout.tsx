import { LogOutIcon, UserIcon } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { ADMIN_SESSION_COOKIE, isSessionValid } from "@/lib/admin-session";

const NAV_ITEMS = [
	{ href: "/admin", label: "Dashboard" },
	{ href: "/admin/guests", label: "Guests" },
	{ href: "/admin/website", label: "Website" },
	{ href: "/admin/settings", label: "Settings" },
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
	const cookieStore = await cookies();
	const isAuthenticated = isSessionValid(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

	return (
		<div className="admin-root min-h-dvh bg-background text-foreground">
			{isAuthenticated && (
				<nav className="flex items-center gap-2 border-b px-6 py-3">
					{NAV_ITEMS.map((item) => (
						<Button key={item.href} variant="ghost" size="sm" asChild>
							<Link href={item.href}>{item.label}</Link>
						</Button>
					))}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="ml-auto" aria-label="Account menu">
								<UserIcon />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<form action={logout}>
								<DropdownMenuItem asChild>
									<button type="submit" className="w-full">
										<LogOutIcon />
										Log out
									</button>
								</DropdownMenuItem>
							</form>
						</DropdownMenuContent>
					</DropdownMenu>
				</nav>
			)}
			<div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
			<Toaster />
		</div>
	);
}
