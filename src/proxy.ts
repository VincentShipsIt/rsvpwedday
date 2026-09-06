import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isSessionValid } from "@/lib/admin-session";

export function proxy(request: NextRequest) {
	if (request.nextUrl.pathname === "/admin/login") {
		return NextResponse.next();
	}

	const cookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
	if (!isSessionValid(cookie)) {
		return NextResponse.redirect(new URL("/admin/login", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/admin/:path*"],
};
