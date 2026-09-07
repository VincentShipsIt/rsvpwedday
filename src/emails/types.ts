import type { EmailCopy } from "@/domain/email-copy";
import type { EmailKind, Locale, SiteTheme } from "@/generated/prisma/enums";

export type EmailEvent = {
	id: string;
	name: string;
	startsAt: Date;
	venue: string;
};

export type EmailTemplateProps = {
	kind: EmailKind;
	locale: Locale;
	theme: SiteTheme;
	copy: EmailCopy;
	coupleNames: string;
	heroImageUrl: string | null;
	events: EmailEvent[];
	link: string;
};
