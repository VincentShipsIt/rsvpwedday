import { isRichTextEmpty, normalizeRichText } from "@/domain/rich-text";
import type { EmailKind } from "@/generated/prisma/enums";
import type { Dictionary } from "@/i18n";
import { t } from "@/i18n";

export type EmailCopyOverride = { subject: string; heading: string; body: string };

export type EmailCopyVars = { name: string; coupleNames: string; deadline: string };

export type EmailCopy = { subject: string; heading: string; bodyHtml: string; cta: string | null };

// Placeholders the admin may use in any email field. Kept here so the admin hint, the resolver
// and the tests agree on the list.
export const EMAIL_PLACEHOLDERS = ["name", "coupleNames", "deadline"] as const;

const dictionaryKeyByKind: Record<EmailKind, keyof Dictionary["emails"]> = {
	INVITE: "invite",
	REMINDER: "reminder",
	CONFIRMATION: "confirmation",
	PHOTOS: "photos",
};

/*
 * Resolves the copy for one email: an admin override wins per field, the dictionary's default
 * fills any field left empty, and `{placeholders}` are substituted afterwards in both. The body
 * is rich text (see `src/domain/rich-text.ts`); a dictionary default is plain text and gets the
 * same paragraph upgrade an old textarea value does.
 */
export function resolveEmailCopy(
	kind: EmailKind,
	dictionary: Dictionary,
	override: EmailCopyOverride | null | undefined,
	vars: EmailCopyVars
): EmailCopy {
	const defaults = dictionary.emails[dictionaryKeyByKind[kind]];
	const subject = override?.subject.trim() || defaults.subject;
	const heading = override?.heading.trim() || defaults.heading;
	const body = override && !isRichTextEmpty(override.body) ? override.body : defaults.body;
	return {
		subject: t(subject, vars),
		heading: t(heading, vars),
		bodyHtml: normalizeRichText(t(body, vars)),
		cta: "cta" in defaults ? defaults.cta : null,
	};
}
