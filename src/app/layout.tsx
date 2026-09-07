import type { Metadata } from "next";
import {
	Cormorant_Garamond,
	Fraunces,
	Instrument_Sans,
	Instrument_Serif,
	Inter,
	Lora,
	Monsieur_La_Doulaise,
	Pinyon_Script,
	Playfair_Display,
} from "next/font/google";
import type { ReactNode } from "react";
import "@/app/globals.css";
import { Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

const cormorant = Cormorant_Garamond({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-cormorant",
});

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

// MODERN theme: display + body pairing.
const instrumentSerif = Instrument_Serif({
	subsets: ["latin"],
	weight: "400",
	style: ["normal", "italic"],
	variable: "--font-instrument-serif",
});

const instrumentSans = Instrument_Sans({
	subsets: ["latin"],
	variable: "--font-instrument-sans",
});

// GARDEN theme: Lora for headings and body, Pinyon Script for the couple's names.
const lora = Lora({
	subsets: ["latin"],
	style: ["normal", "italic"],
	variable: "--font-lora",
});

const pinyonScript = Pinyon_Script({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-pinyon",
});

// BOHO theme: Fraunces for display, Instrument Sans (already loaded above) for body.
// `next/font/google` only allows the `opsz` optical-size axis alongside `weight: "variable"` — it
// throws when explicit weights are given instead — so fixed heavy weights and `axes` are mutually
// exclusive here; we want the fixed weights, so `axes` is omitted rather than left to throw.
const fraunces = Fraunces({
	subsets: ["latin"],
	weight: ["600", "700", "900"],
	variable: "--font-fraunces",
});

// MEDITERRANEAN theme: Playfair Display for headings (the reference invitations pair a Garamond-
// style serif with a script), Monsieur La Doulaise for the script accent, Lora (loaded above) for
// body copy.
const playfairDisplay = Playfair_Display({
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	style: ["normal", "italic"],
	variable: "--font-playfair",
});

const monsieurLaDoulaise = Monsieur_La_Doulaise({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-monsieur",
});

// `generateMetadata` (not a static `metadata` export) because the title/description/OG copy come
// from the database at request time; `dynamic = "force-dynamic"` keeps `next build`'s static
// analysis from ever calling `db` with no `DATABASE_URL` set (see AGENTS.md's CI note).
export const dynamic = "force-dynamic";

const DEFAULT_COUPLE_NAMES = "Our Wedding";
const DEFAULT_TAGLINE = "We're getting married and can't wait to celebrate with you.";

export async function generateMetadata(): Promise<Metadata> {
	const [settings, siteContent] = await Promise.all([
		db.settings.findUnique({ where: { id: 1 } }),
		db.siteContent.findUnique({ where: { id: 1 }, include: { translations: true } }),
	]);

	const coupleNames = settings?.coupleNames || DEFAULT_COUPLE_NAMES;
	const tagline =
		siteContent?.translations.find((translation) => translation.locale === Locale.en)?.tagline ||
		DEFAULT_TAGLINE;
	const title = `${coupleNames} — Wedding RSVP`;

	return {
		title,
		description: tagline,
		openGraph: { title, description: tagline },
		twitter: { card: "summary_large_image", title, description: tagline },
	};
}

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			className={`${cormorant.variable} ${inter.variable} ${instrumentSerif.variable} ${instrumentSans.variable} ${lora.variable} ${pinyonScript.variable} ${fraunces.variable} ${playfairDisplay.variable} ${monsieurLaDoulaise.variable}`}
		>
			<body>{children}</body>
		</html>
	);
}
