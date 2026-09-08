import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { logout } from "@/app/admin/actions";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/admin-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ADMIN_SESSION_COOKIE, isSessionValid } from "@/lib/admin-session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
	const cookieStore = await cookies();
	const isAuthenticated = isSessionValid(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

	return (
		<div className="admin-root min-h-dvh bg-background text-foreground">
			{isAuthenticated ? (
				<div className="flex min-h-dvh flex-col md:flex-row">
					<AdminSidebar logout={logout} />
					<AdminMobileNav />
					{/* `min-w-0` lets a wide child (the guests table) scroll inside this column
					    instead of pushing the whole page sideways. */}
					<main className="min-w-0 flex-1">
						{/*
						 * The admin fills the screen it is given — a laptop should not read a guest
						 * list through a 56rem letterbox — and only stops at 96rem, wider than any
						 * laptop, so a table does not stretch across an ultra-wide display.
						 */}
						<div className="mx-auto max-w-[96rem] px-6 py-10 lg:px-10">{children}</div>
					</main>
				</div>
			) : (
				children
			)}
			<Toaster />
		</div>
	);
}
