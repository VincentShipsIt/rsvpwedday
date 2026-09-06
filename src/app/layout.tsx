import type { Metadata } from "next";
import {
	Cormorant_Garamond,
	Fraunces,
	Instrument_Sans,
	Instrument_Serif,
	Inter,
	Lora,
	Pinyon_Script,
} from "next/font/google";
import type { ReactNode } from "react";
import "@/app/globals.css";

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

export const metadata: Metadata = {
	title: "Wedding RSVP",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			className={`${cormorant.variable} ${inter.variable} ${instrumentSerif.variable} ${instrumentSans.variable} ${lora.variable} ${pinyonScript.variable} ${fraunces.variable}`}
		>
			<body>{children}</body>
		</html>
	);
}
