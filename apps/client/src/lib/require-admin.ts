import "server-only";

import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isSessionValid } from "@/lib/admin-session";

export async function requireAdmin(): Promise<void> {
	const cookieStore = await cookies();
	if (!isSessionValid(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
		throw new Error("Unauthorized");
	}
}
