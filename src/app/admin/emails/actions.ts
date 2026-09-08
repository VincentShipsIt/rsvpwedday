"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sanitizeRichText } from "@/domain/rich-text";
import { EmailKind, Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { renderEmail, sendTestEmail } from "@/lib/email";
import { env } from "@/lib/env";
import type { FormActionResult } from "@/lib/form-action";
import { requireAdmin } from "@/lib/require-admin";

export type EmailTemplateInput = {
	kind: EmailKind;
	locale: Locale;
	subject: string;
	heading: string;
	body: string;
};
export type EmailTemplatesInput = { templates: EmailTemplateInput[] };

export async function updateEmailTemplates(input: EmailTemplatesInput): Promise<FormActionResult> {
	await requireAdmin();
	const parsed = z.array(draftSchema).max(12).safeParse(input.templates);
	if (!parsed.success) return { ok: false, error: "Enter valid email templates." };
	await db.$transaction(async (tx) => {
		for (const template of parsed.data) {
			const data = {
				subject: template.subject.trim(),
				heading: template.heading.trim(),
				body: sanitizeRichText(template.body),
			};
			await tx.emailTemplate.upsert({
				where: { kind_locale: { kind: template.kind, locale: template.locale } },
				create: { kind: template.kind, locale: template.locale, ...data },
				update: data,
			});
		}
	});

	revalidatePath("/admin/emails");
	return { ok: true };
}

const draftSchema = z.object({
	kind: z.enum(EmailKind),
	locale: z.enum(Locale),
	subject: z
		.string()
		.max(1000)
		.transform((value) => value.trim()),
	heading: z
		.string()
		.max(2000)
		.transform((value) => value.trim()),
	body: z.string().max(100_000).transform(sanitizeRichText),
});
const testEmailSchema = draftSchema.extend({ to: z.email() });

export async function sendTestEmailAction(input: {
	kind: EmailKind;
	locale: Locale;
	to: string;
	subject: string;
	heading: string;
	body: string;
}): Promise<FormActionResult> {
	await requireAdmin();
	const parsed = testEmailSchema.safeParse({ ...input, to: input.to.trim() });
	if (!parsed.success) {
		return { ok: false, error: "Enter a valid email address and email draft." };
	}
	const { error } = await sendTestEmail(
		parsed.data.kind,
		parsed.data.locale,
		parsed.data.to,
		parsed.data
	);
	if (error) {
		return { ok: false, error };
	}
	if (!env.RESEND_API_KEY) {
		return {
			ok: false,
			error: "No RESEND_API_KEY is set, so the email was only logged on the server.",
		};
	}
	return { ok: true };
}

// Renders one email from the copy currently in the editor, so the preview beside the fields shows
// what is being typed rather than what was last saved. Returns a full HTML document for `srcDoc`.
export async function renderEmailPreview(input: {
	kind: EmailKind;
	locale: Locale;
	subject: string;
	heading: string;
	body: string;
}): Promise<{ html: string; subject: string }> {
	await requireAdmin();
	const draft = draftSchema.parse(input);
	const email = await renderEmail(draft.kind, draft.locale, "Sam", `${env.APP_URL}/`, null, draft);
	return { html: email.html, subject: email.subject };
}
