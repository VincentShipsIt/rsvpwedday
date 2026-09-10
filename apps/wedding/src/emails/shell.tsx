import { Body, Container, Head, Html, Img, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";
import type { EmailTheme } from "@/emails/theme";
import type { Locale } from "@/generated/prisma/enums";
import { locales } from "@/i18n/locales";

// Themed frame around every email: the couple's names (and hero photo, when set) above a card
// that holds the message, on the landing page's own background colour.
export function EmailShell({
	locale,
	preview,
	theme,
	coupleNames,
	heroImageUrl,
	children,
}: {
	locale: Locale;
	preview: string;
	theme: EmailTheme;
	coupleNames: string;
	heroImageUrl: string | null;
	children: ReactNode;
}) {
	return (
		<Html lang={locale} dir={locales[locale].dir}>
			<Head>
				{/* The message body is admin-authored HTML (see `src/domain/rich-text.ts`); these are the
				    only styles it needs, mirroring `.rich-text` on the site. */}
				<style>{`
					.rich-text p, .rich-text ul, .rich-text ol, .rich-text blockquote { margin: 0 0 12px; }
					.rich-text h3, .rich-text h4 { margin: 18px 0 8px; font-family: ${theme.headingFont}; font-weight: 500; line-height: 1.2; }
					.rich-text h3 { font-size: 21px; }
					.rich-text h4 { font-size: 17px; }
					.rich-text a { color: ${theme.accent}; }
					.rich-text ul, .rich-text ol { padding-left: 22px; }
				`}</style>
			</Head>
			<Preview>{preview}</Preview>
			<Body
				style={{
					margin: 0,
					backgroundColor: theme.background,
					color: theme.ink,
					fontFamily: theme.bodyFont,
				}}
			>
				<Container style={{ maxWidth: "560px", padding: "32px 16px" }}>
					<Section style={{ textAlign: "center", paddingBottom: "20px" }}>
						<Text
							style={{
								margin: 0,
								fontFamily: theme.headingFont,
								fontSize: "28px",
								letterSpacing: "0.02em",
								color: theme.ink,
							}}
						>
							{coupleNames}
						</Text>
					</Section>
					<Section
						style={{
							backgroundColor: theme.surface,
							border: `1px solid ${theme.border}`,
							borderRadius: theme.radius,
							overflow: "hidden",
						}}
					>
						{heroImageUrl && (
							<Img
								src={heroImageUrl}
								alt=""
								width="560"
								style={{ display: "block", width: "100%", height: "auto" }}
							/>
						)}
						<Section style={{ padding: "28px 32px 32px" }}>{children}</Section>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}
