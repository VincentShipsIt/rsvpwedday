"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasSuccessfulEmail } from "@/domain/email-delivery";
import { getInvitationStatus } from "@/domain/invitation";
import { notDeleted } from "@/domain/soft-delete";
import { EmailKind } from "@/generated/prisma/enums";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { db } from "@/lib/db";
import { sendInvitationEmail } from "@/lib/email";
import type { FormActionResult } from "@/lib/form-action";
import { requireAdmin } from "@/lib/require-admin";

export async function logout(): Promise<void> {
	await requireAdmin();
	const cookieStore = await cookies();
	cookieStore.delete(ADMIN_SESSION_COOKIE);
	redirect("/admin/login");
}

async function sendOne(kind: EmailKind, invitationId: string): Promise<FormActionResult> {
	const result = await sendInvitationEmail(kind, invitationId);
	revalidatePath("/admin");
	revalidatePath("/admin/guests");
	return result.status === "accepted"
		? { ok: true }
		: {
				ok: false,
				error: result.error ?? "Email simulated: configure the email provider to send it.",
			};
}

export async function sendInviteToOne(invitationId: string): Promise<FormActionResult> {
	await requireAdmin();
	return sendOne(EmailKind.INVITE, invitationId);
}
export async function sendReminderToOne(invitationId: string): Promise<FormActionResult> {
	await requireAdmin();
	return sendOne(EmailKind.REMINDER, invitationId);
}

async function sendBatch(kind: EmailKind, targets: { id: string }[]): Promise<void> {
	const counts = { accepted: 0, failed: 0, simulated: 0 };
	for (const invitation of targets) {
		try {
			const result = await sendInvitationEmail(kind, invitation.id);
			counts[result.status === "attempted" ? "failed" : result.status] += 1;
		} catch {
			counts.failed += 1;
		}
	}
	revalidatePath("/admin");
	revalidatePath("/admin/guests");
	redirect(
		`/admin?accepted=${counts.accepted}&failed=${counts.failed}&simulated=${counts.simulated}`
	);
}

export async function sendInvitesToUnsent(): Promise<void> {
	await requireAdmin();
	const invitations = await db.invitation.findMany({ include: { emails: true } });
	const targets = invitations.filter(
		(invitation) => !hasSuccessfulEmail(invitation.emails, EmailKind.INVITE)
	);

	await sendBatch(EmailKind.INVITE, targets);
}

// The photo-day nudge, pressed on the morning of the wedding. Only households with at least one
// accepted guest get it: someone who declined has no use for a link to the party's photo book.
export async function sendPhotoInviteToAttending(): Promise<void> {
	await requireAdmin();
	const invitations = await db.invitation.findMany({
		include: {
			childAttendance: true,
			guests: { where: notDeleted, include: { attendance: true } },
		},
	});
	const attending = invitations.filter(
		(invitation) => getInvitationStatus(invitation) === "accepted"
	);

	await sendBatch(EmailKind.PHOTOS, attending);
}

export async function remindAllPending(): Promise<void> {
	await requireAdmin();
	const invitations = await db.invitation.findMany({
		include: {
			childAttendance: true,
			guests: { where: notDeleted, include: { attendance: true } },
		},
	});
	const pending = invitations.filter((invitation) => getInvitationStatus(invitation) === "pending");

	await sendBatch(EmailKind.REMINDER, pending);
}
