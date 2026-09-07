import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { EmailShell } from "@/emails/shell";
import { emailThemes } from "@/emails/theme";
import type { EmailTemplateProps } from "@/emails/types";
import { EmailKind } from "@/generated/prisma/enums";
import { formatDate } from "@/lib/format";

/*
 * The one template behind invite, reminder and confirmation. The copy (subject, heading, body)
 * is already resolved by `resolveEmailCopy`; the kind only decides whether the event list and
 * the RSVP button appear, since a confirmation has nothing left to ask for.
 */
export function InvitationEmail({
	kind,
	locale,
	theme: themeKey,
	copy,
	coupleNames,
	heroImageUrl,
	events,
	link,
}: EmailTemplateProps) {
	const theme = emailThemes[themeKey];
	const showCallToAction = kind !== EmailKind.CONFIRMATION;

	return (
		<EmailShell
			locale={locale}
			preview={copy.subject}
			theme={theme}
			coupleNames={coupleNames}
			heroImageUrl={heroImageUrl}
		>
			<Heading
				as="h1"
				style={{
					margin: "0 0 16px",
					fontFamily: theme.headingFont,
					fontSize: "26px",
					fontWeight: 500,
					lineHeight: 1.2,
					color: theme.ink,
				}}
			>
				{copy.heading}
			</Heading>
			<Section
				className="rich-text"
				style={{ fontSize: "15px", lineHeight: 1.6, color: theme.ink }}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitised by resolveEmailCopy
				dangerouslySetInnerHTML={{ __html: copy.bodyHtml }}
			/>
			{showCallToAction && events.length > 0 && (
				<Section
					style={{
						margin: "20px 0",
						padding: "14px 18px",
						backgroundColor: theme.background,
						borderRadius: theme.radius,
					}}
				>
					{events.map((event) => (
						<Text
							key={`${event.name}|${event.startsAt.toISOString()}`}
							style={{ margin: "4px 0", fontSize: "14px", color: theme.ink }}
						>
							<strong style={{ fontFamily: theme.headingFont, fontSize: "16px" }}>
								{event.name}
							</strong>
							<br />
							<span style={{ color: theme.muted }}>
								{formatDate(event.startsAt, locale)} · {event.venue}
							</span>
						</Text>
					))}
				</Section>
			)}
			{showCallToAction && copy.cta && (
				<Section style={{ textAlign: "center", margin: "24px 0 8px" }}>
					<Button
						href={link}
						style={{
							backgroundColor: theme.accent,
							color: theme.accentText,
							padding: "12px 28px",
							borderRadius: theme.radius === "0px" ? "0px" : "999px",
							fontFamily: theme.bodyFont,
							fontSize: "13px",
							letterSpacing: "0.12em",
							textTransform: "uppercase",
							textDecoration: "none",
						}}
					>
						{copy.cta}
					</Button>
				</Section>
			)}
			<Hr style={{ borderColor: theme.border, margin: "24px 0 12px" }} />
			<Text style={{ margin: 0, fontSize: "12px", color: theme.muted, wordBreak: "break-all" }}>
				{link}
			</Text>
		</EmailShell>
	);
}
