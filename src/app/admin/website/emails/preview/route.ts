import type { NextRequest } from "next/server";
import { EmailKind, Locale } from "@/generated/prisma/enums";
import { isLocale } from "@/i18n/locales";
import { renderEmail } from "@/lib/email";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

function isEmailKind(value: string | null): value is EmailKind {
	return value !== null && Object.hasOwn(EmailKind, value);
}

// Renders one email as a full HTML document for the admin's preview iframe. Reached only through
// `/admin/*`, which the proxy gates behind the admin session.
export async function GET(request: NextRequest): Promise<Response> {
	const kind = request.nextUrl.searchParams.get("kind");
	const locale = request.nextUrl.searchParams.get("locale") ?? Locale.en;
	if (!isEmailKind(kind) || !isLocale(locale)) {
		return new Response("Unknown email", { status: 400 });
	}
	const email = await renderEmail(kind, locale, "Sam", `${env.APP_URL}/`);
	return new Response(email.html, {
		headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
	});
}
