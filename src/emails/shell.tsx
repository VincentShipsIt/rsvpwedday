import { Body, Container, Head, Html, Preview } from "@react-email/components";
import type { ReactNode } from "react";
import type { Locale } from "@/generated/prisma/enums";
import { locales } from "@/i18n/locales";

export function EmailShell({
	locale,
	preview,
	children,
}: {
	locale: Locale;
	preview: string;
	children: ReactNode;
}) {
	return (
		<Html lang={locale} dir={locales[locale].dir}>
			<Head />
			<Preview>{preview}</Preview>
			<Body style={{ backgroundColor: "#faf7f0", fontFamily: "Georgia, 'Times New Roman', serif" }}>
				<Container style={{ padding: "32px", maxWidth: "560px" }}>{children}</Container>
			</Body>
		</Html>
	);
}
