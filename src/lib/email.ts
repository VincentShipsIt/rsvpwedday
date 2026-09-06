import { render } from "@react-email/components";
import type { ComponentType } from "react";
import { createElement } from "react";
import { Resend } from "resend";
import { ConfirmationEmail } from "@/emails/confirmation";
import { InviteEmail } from "@/emails/invite";
import { ReminderEmail } from "@/emails/reminder";
import type { EmailTemplateProps } from "@/emails/types";
import { EmailKind } from "@/generated/prisma/client";
import { getDictionary, t } from "@/i18n";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

const templateByKind: Record<EmailKind, ComponentType<EmailTemplateProps>> = {
	[EmailKind.INVITE]: InviteEmail,
	[EmailKind.REMINDER]: ReminderEmail,
	[EmailKind.CONFIRMATION]: ConfirmationEmail,
};

export async function sendInvitationEmail(kind: EmailKind, invitationId: string): Promise<void> {
	const invitation = await db.invitation.findUniqueOrThrow({
		where: { id: invitationId },
		include: { guests: true },
	});
	const settings = await db.settings.findUniqueOrThrow({ where: { id: 1 } });
	const events = await db.event.findMany({
		orderBy: { sortOrder: "asc" },
		include: { translations: true },
	});

	const dictionary = getDictionary(invitation.locale);
	const link = `${env.APP_URL}/rsvp/${invitation.token}`;

	const props: EmailTemplateProps = {
		dictionary,
		invitation: { locale: invitation.locale, guests: invitation.guests },
		settings: {
			coupleNames: settings.coupleNames,
			rsvpDeadline: settings.rsvpDeadline,
			replyTo: settings.replyTo,
		},
		events: events.map((event) => {
			const translation =
				event.translations.find((candidate) => candidate.locale === invitation.locale) ??
				event.translations[0];
			return {
				name: translation?.name ?? event.slug,
				startsAt: event.startsAt,
				venue: event.venue,
			};
		}),
		link,
	};

	const subjectByKind: Record<EmailKind, string> = {
		[EmailKind.INVITE]: t(dictionary.emails.invite.subject, { coupleNames: settings.coupleNames }),
		[EmailKind.REMINDER]: t(dictionary.emails.reminder.subject, {
			coupleNames: settings.coupleNames,
		}),
		[EmailKind.CONFIRMATION]: t(dictionary.emails.confirmation.subject, {
			coupleNames: settings.coupleNames,
		}),
	};
	const subject = subjectByKind[kind];
	const html = await render(createElement(templateByKind[kind], props));

	let resendId: string | null = null;
	let error: string | null = null;

	if (env.RESEND_API_KEY) {
		const resend = new Resend(env.RESEND_API_KEY);
		const { data, error: sendError } = await resend.emails.send({
			from: env.EMAIL_FROM,
			to: invitation.email,
			subject,
			html,
			replyTo: settings.replyTo ?? undefined,
		});
		if (sendError) {
			error = sendError.message;
		} else {
			resendId = data?.id ?? null;
		}
	} else {
		console.info(`[email:${kind}] ${subject} -> ${link}`);
	}

	await db.emailLog.create({
		data: { invitationId, kind, resendId, error },
	});
}
