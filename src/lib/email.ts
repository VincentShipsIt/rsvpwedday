import { render } from "@react-email/components";
import { createElement } from "react";
import { Resend } from "resend";
import { type EmailCopyOverride, resolveEmailCopy } from "@/domain/email-copy";
import { filterToInvited, invitedEventIds } from "@/domain/invitation-events";
import { InvitationEmail } from "@/emails/invitation-email";
import type { EmailEvent, EmailTemplateProps } from "@/emails/types";
import { EmailKind, type Locale } from "@/generated/prisma/enums";
import { getDictionary } from "@/i18n";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { getHomeHero } from "@/lib/home-hero";

export type RenderedEmail = { subject: string; html: string };

// Everything an email needs besides the guest: settings, site theme, hero photo, events, and the
// admin's copy override for this kind/locale. Fetched once per send (or preview).
async function loadEmailContext(kind: EmailKind, locale: Locale) {
	const [settings, siteContent, hero, events, template] = await Promise.all([
		db.settings.findUniqueOrThrow({ where: { id: 1 } }),
		db.siteContent.findUnique({ where: { id: 1 } }),
		getHomeHero(locale),
		db.event.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
		db.emailTemplate.findUnique({ where: { kind_locale: { kind, locale } } }),
	]);

	const emailEvents: EmailEvent[] = events.map((event) => {
		const translation =
			event.translations.find((candidate) => candidate.locale === locale) ?? event.translations[0];
		return {
			id: event.id,
			name: translation?.name ?? event.slug,
			startsAt: event.startsAt,
			venue: event.venue,
		};
	});

	return { settings, siteContent, hero, events: emailEvents, template };
}

export async function renderEmail(
	kind: EmailKind,
	locale: Locale,
	guestFirstName: string,
	link: string,
	// The household's invited events; `null` (previews, tests) lists every event.
	eventIds: string[] | null = null,
	// Unsaved copy from the admin's editor, so its preview shows what is being typed rather than
	// what was last saved. Omitted everywhere else, which uses the stored template.
	copyOverride?: EmailCopyOverride
): Promise<RenderedEmail> {
	const context = await loadEmailContext(kind, locale);
	const { settings, siteContent, hero, template } = context;
	const events = eventIds ? filterToInvited(context.events, eventIds) : context.events;
	const copy = resolveEmailCopy(kind, getDictionary(locale), copyOverride ?? template, {
		name: guestFirstName,
		coupleNames: settings.coupleNames,
		deadline: formatDate(settings.rsvpDeadline, locale),
	});

	const props: EmailTemplateProps = {
		kind,
		locale,
		theme: siteContent?.theme ?? "EDITORIAL",
		copy,
		coupleNames: settings.coupleNames,
		heroImageUrl: hero.imageUrl,
		events,
		link,
	};

	return { subject: copy.subject, html: await render(createElement(InvitationEmail, props)) };
}

type DeliveryResult = { resendId: string | null; error: string | null };

async function deliver(
	kind: EmailKind,
	to: string,
	email: RenderedEmail,
	replyTo: string | null,
	link: string
): Promise<DeliveryResult> {
	if (!env.RESEND_API_KEY) {
		console.info(`[email:${kind}] ${email.subject} -> ${link}`);
		return { resendId: null, error: null };
	}
	const resend = new Resend(env.RESEND_API_KEY);
	const { data, error } = await resend.emails.send({
		from: env.EMAIL_FROM,
		to,
		subject: email.subject,
		html: email.html,
		replyTo: replyTo ?? undefined,
	});
	return error
		? { resendId: null, error: error.message }
		: { resendId: data?.id ?? null, error: null };
}

export async function sendInvitationEmail(kind: EmailKind, invitationId: string): Promise<void> {
	const invitation = await db.invitation.findUniqueOrThrow({
		where: { id: invitationId },
		include: { guests: { where: { addedByGuest: false }, include: { attendance: true } } },
	});
	const settings = await db.settings.findUniqueOrThrow({ where: { id: 1 } });
	// Every kind but the photo-day nudge sends the guest to their RSVP form; that one sends them
	// straight to the camera, which is the only thing it asks for.
	const link =
		kind === EmailKind.PHOTOS
			? `${env.APP_URL}/rsvp/${invitation.token}/memories`
			: `${env.APP_URL}/rsvp/${invitation.token}`;

	const email = await renderEmail(
		kind,
		invitation.locale,
		invitation.guests[0]?.firstName ?? "",
		link,
		invitedEventIds(invitation.guests)
	);
	const { resendId, error } = await deliver(kind, invitation.email, email, settings.replyTo, link);

	await db.emailLog.create({ data: { invitationId, kind, resendId, error } });
}

// A test send from the admin: real template, real settings, a stand-in guest and a link to the
// home page instead of a guest token. Not written to the email log, so it never shows up as
// "sent" against a guest.
export async function sendTestEmail(
	kind: EmailKind,
	locale: Locale,
	to: string
): Promise<DeliveryResult> {
	const settings = await db.settings.findUniqueOrThrow({ where: { id: 1 } });
	const link = `${env.APP_URL}/`;
	const email = await renderEmail(kind, locale, "Sam", link);
	return deliver(kind, to, email, settings.replyTo, link);
}
