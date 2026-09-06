import { Heading, Hr, Text } from "@react-email/components";
import { EmailShell } from "@/emails/shell";
import type { EmailTemplateProps } from "@/emails/types";
import { t } from "@/i18n";
import { formatDate } from "@/lib/format";

export function ConfirmationEmail({ dictionary, invitation, settings, link }: EmailTemplateProps) {
	const guestName = invitation.guests[0]?.firstName ?? "";
	const deadline = formatDate(settings.rsvpDeadline, invitation.locale);
	const preview = t(dictionary.emails.confirmation.subject, { coupleNames: settings.coupleNames });

	return (
		<EmailShell locale={invitation.locale} preview={preview}>
			<Heading>{t(dictionary.emails.confirmation.heading, { name: guestName })}</Heading>
			<Text>{t(dictionary.emails.confirmation.body, { deadline })}</Text>
			<Hr />
			<Text>{link}</Text>
		</EmailShell>
	);
}

export default ConfirmationEmail;
