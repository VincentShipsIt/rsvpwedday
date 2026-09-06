import { cookies } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/admin/actions";
import { ADMIN_SESSION_COOKIE, isSessionValid } from "@/lib/admin-session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
	const cookieStore = await cookies();
	const isAuthenticated = isSessionValid(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

	return (
		<div className="min-h-dvh bg-ivory text-ink">
			{isAuthenticated && (
				<nav className="flex flex-wrap items-center gap-4 border-b border-ink/10 px-6 py-4 text-sm">
					<Link href="/admin">Dashboard</Link>
					<Link href="/admin/invitations/new">New invitation</Link>
					<Link href="/admin/import">Import</Link>
					<Link href="/admin/export">Export</Link>
					<Link href="/admin/settings">Settings</Link>
					<form action={logout} className="ml-auto">
						<button type="submit" className="text-green underline underline-offset-4">
							Log out
						</button>
					</form>
				</nav>
			)}
			<div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
		</div>
	);
}
