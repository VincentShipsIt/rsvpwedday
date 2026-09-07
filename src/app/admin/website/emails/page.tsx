import { EmailsForm, type EmailsFormProps } from "@/app/admin/website/emails/emails-form";
import { WebsiteNav } from "@/app/admin/website/website-nav";
import { EmailKind } from "@/generated/prisma/enums";
import { getDictionary } from "@/i18n";
import { localeCodes } from "@/i18n/locales";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const KINDS = [EmailKind.INVITE, EmailKind.REMINDER, EmailKind.CONFIRMATION] as const;
const DICTIONARY_KEY = {
	INVITE: "invite",
	REMINDER: "reminder",
	CONFIRMATION: "confirmation",
} as const;

export default async function EmailsPage() {
	const templates = await db.emailTemplate.findMany();

	return (
		<div className="flex flex-col gap-6">
			<WebsiteNav current="/admin/website/emails" />
			<h1 className="text-2xl font-medium">Emails</h1>
			<p className="text-sm text-muted-foreground">
				The invite, reminder and confirmation guests receive. Empty fields keep the built-in copy
				shown as the placeholder. Emails use the website&apos;s theme, hero photo and event list
				automatically.
			</p>
			<EmailsForm
				initialTemplates={KINDS.flatMap((kind) =>
					localeCodes.map((locale) => {
						const stored = templates.find(
							(template) => template.kind === kind && template.locale === locale
						);
						return {
							kind,
							locale,
							subject: stored?.subject ?? "",
							heading: stored?.heading ?? "",
							body: stored?.body ?? "",
						};
					})
				)}
				defaults={
					Object.fromEntries(
						KINDS.map((kind) => [
							kind,
							Object.fromEntries(
								localeCodes.map((locale) => {
									const copy = getDictionary(locale).emails[DICTIONARY_KEY[kind]];
									return [
										locale,
										{ subject: copy.subject, heading: copy.heading, body: copy.body },
									];
								})
							),
						])
					) as EmailsFormProps["defaults"]
				}
				sendingEnabled={Boolean(env.RESEND_API_KEY)}
			/>
		</div>
	);
}
