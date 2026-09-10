"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
	ADMIN_SESSION_COOKIE,
	ADMIN_SESSION_MAX_AGE_SECONDS,
	createSessionCookieValue,
	isPasswordValid,
} from "@/lib/admin-session";

export async function login(formData: FormData): Promise<void> {
	const password = formData.get("password");
	if (typeof password !== "string" || !isPasswordValid(password)) {
		redirect("/admin/login?error=1");
	}

	const cookieStore = await cookies();
	cookieStore.set(ADMIN_SESSION_COOKIE, createSessionCookieValue(), {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
	});

	redirect("/admin");
}
