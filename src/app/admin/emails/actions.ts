"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sanitizeRichText } from "@/domain/rich-text";
import type { EmailKind, Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { renderEmail, sendTestEmail } from "@/lib/email";
import { env } from "@/lib/env";
import type { FormActionResult } from "@/lib/form-action";

export type EmailTemplateInput = {
	kind: EmailKind;
	locale: Locale;
	subject: string;
	heading: string;
	body: string;
};
export type EmailTemplatesInput = { templates: EmailTemplateInput[] };

export async function updateEmailTemplates(input: EmailTemplatesInput): Promise<FormActionResult> {
	await db.$transaction(async (tx) => {
		for (const template of input.templates) {
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

const testEmailSchema = z.object({ to: z.email() });

export async function sendTestEmailAction(input: {
	kind: EmailKind;
	locale: Locale;
	to: string;
}): Promise<FormActionResult> {
	const parsed = testEmailSchema.safeParse({ to: input.to.trim() });
	if (!parsed.success) {
		return { ok: false, error: "Enter a valid email address." };
	}
	const { error } = await sendTestEmail(input.kind, input.locale, parsed.data.to);
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
	const email = await renderEmail(input.kind, input.locale, "Sam", `${env.APP_URL}/`, null, {
		subject: input.subject,
		heading: input.heading,
		body: sanitizeRichText(input.body),
	});
	return { html: email.html, subject: email.subject };
}
