"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getInvitationStatus } from "@/domain/invitation";
import { EmailKind } from "@/generated/prisma/client";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { db } from "@/lib/db";
import { sendInvitationEmail } from "@/lib/email";

export async function logout(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(ADMIN_SESSION_COOKIE);
	redirect("/admin/login");
}

export async function sendInviteToOne(invitationId: string): Promise<void> {
	await sendInvitationEmail(EmailKind.INVITE, invitationId);
	revalidatePath("/admin");
}

export async function sendReminderToOne(invitationId: string): Promise<void> {
	await sendInvitationEmail(EmailKind.REMINDER, invitationId);
	revalidatePath("/admin");
}

export async function sendInvitesToUnsent(): Promise<void> {
	const invitations = await db.invitation.findMany({ include: { emails: true } });
	const targets = invitations.filter(
		(invitation) => !invitation.emails.some((log) => log.kind === EmailKind.INVITE)
	);

	for (const invitation of targets) {
		await sendInvitationEmail(EmailKind.INVITE, invitation.id);
	}

	revalidatePath("/admin");
	redirect("/admin");
}

export async function remindAllPending(): Promise<void> {
	const invitations = await db.invitation.findMany({
		include: { guests: { include: { attendance: true } } },
	});
	const pending = invitations.filter((invitation) => getInvitationStatus(invitation) === "pending");

	for (const invitation of pending) {
		await sendInvitationEmail(EmailKind.REMINDER, invitation.id);
	}

	revalidatePath("/admin");
	redirect("/admin");
}
