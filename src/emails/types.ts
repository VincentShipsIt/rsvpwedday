import type { Locale } from "@/generated/prisma/client";
import type { Dictionary } from "@/i18n";

export type EmailGuest = {
	firstName: string;
	lastName: string;
};

export type EmailInvitation = {
	locale: Locale;
	guests: EmailGuest[];
};

export type EmailSettings = {
	coupleNames: string;
	rsvpDeadline: Date;
	replyTo: string | null;
};

export type EmailEvent = {
	name: string;
	startsAt: Date;
	venue: string;
};

export type EmailTemplateProps = {
	dictionary: Dictionary;
	invitation: EmailInvitation;
	settings: EmailSettings;
	events: EmailEvent[];
	link: string;
};
