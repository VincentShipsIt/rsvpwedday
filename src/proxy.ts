import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isLocale } from "@/i18n/locales";
import { ADMIN_SESSION_COOKIE, isSessionValid } from "@/lib/admin-session";
import { SITE_LOCALE_COOKIE } from "@/lib/site-locale";

const SITE_LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function proxy(request: NextRequest) {
	if (request.nextUrl.pathname === "/") {
		const lang = request.nextUrl.searchParams.get("lang");
		const response = NextResponse.next();
		if (lang && isLocale(lang)) {
			response.cookies.set(SITE_LOCALE_COOKIE, lang, {
				maxAge: SITE_LOCALE_COOKIE_MAX_AGE_SECONDS,
				path: "/",
			});
		}
		return response;
	}

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
	matcher: ["/", "/admin/:path*"],
};
