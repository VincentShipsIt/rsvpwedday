import { Button, Heading, Hr, Text } from "@react-email/components";
import { EmailShell } from "@/emails/shell";
import type { EmailTemplateProps } from "@/emails/types";
import { t } from "@/i18n";
import { formatDate } from "@/lib/format";

export function InviteEmail({
	dictionary,
	invitation,
	settings,
	events,
	link,
}: EmailTemplateProps) {
	const guestName = invitation.guests[0]?.firstName ?? "";
	const deadline = formatDate(settings.rsvpDeadline, invitation.locale);
	const preview = t(dictionary.emails.invite.subject, { coupleNames: settings.coupleNames });

	return (
		<EmailShell locale={invitation.locale} preview={preview}>
			<Heading>{t(dictionary.emails.invite.heading, { name: guestName })}</Heading>
			<Text>{t(dictionary.emails.invite.body, { deadline })}</Text>
			{events.map((event) => (
				<Text key={`${event.name}|${event.startsAt.toISOString()}`}>
					{event.name} · {formatDate(event.startsAt, invitation.locale)} · {event.venue}
				</Text>
			))}
			<Button
				href={link}
				style={{
					backgroundColor: "#2f4d3a",
					color: "#ffffff",
					padding: "12px 24px",
					borderRadius: "6px",
				}}
			>
				{dictionary.emails.invite.cta}
			</Button>
			<Hr />
			<Text>{link}</Text>
		</EmailShell>
	);
}

export default InviteEmail;
