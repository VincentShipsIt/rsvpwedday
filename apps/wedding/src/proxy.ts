import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isLocale } from "@/i18n/locales";
import { ADMIN_SESSION_COOKIE, isSessionValid } from "@/lib/admin-session";
import { SITE_LOCALE_COOKIE } from "@/lib/site-locale";

const SITE_LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

// Paths that are neither the admin nor a public content page: the RSVP flow and the calendar
// download have their own locale handling and never carry the language select.
const NON_SITE_PREFIXES = ["/rsvp", "/calendar", "/api"];

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (pathname.startsWith("/admin")) {
		if (pathname === "/admin/login") {
			return NextResponse.next();
		}
		const cookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
		if (!isSessionValid(cookie)) {
			return NextResponse.redirect(new URL("/admin/login", request.url));
		}
		return NextResponse.next();
	}

	if (NON_SITE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
		return NextResponse.next();
	}

	// Everything else is a public page — `/` or any slug the couple added in `/admin/pages` — and
	// carries the language select, so `?lang=` is remembered for the rest of the visit.
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

export const config = {
	// Every path except Next's own assets and files with an extension (`opengraph-image`, icons),
	// so a page added in the admin is covered the moment it exists, with no matcher to update.
	matcher: ["/((?!_next/static|_next/image|.*\\.[a-z0-9]+$).*)"],
};
