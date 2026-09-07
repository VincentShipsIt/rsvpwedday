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
					<main className="flex-1">
						<div className="mx-auto max-w-4xl px-6 py-10">{children}</div>
					</main>
				</div>
			) : (
				children
			)}
			<Toaster />
		</div>
	);
}
