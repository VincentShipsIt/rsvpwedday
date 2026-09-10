import type { Metadata } from "next";
import { Bodoni_Moda, Instrument_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { studio } from "@/lib/brand";
import "./globals.css";

/*
 * Serif leads, sans serves — the grammar every house in this category shares.
 * Bodoni carries every headline; Instrument Sans never appears above 20px
 * except inside the guest-site mock, where it is imitating a different site.
 */
const display = Bodoni_Moda({
	subsets: ["latin"],
	variable: "--font-display",
	weight: ["400"],
	style: ["normal", "italic"],
});

const body = Instrument_Sans({
	subsets: ["latin"],
	variable: "--font-body",
	weight: ["400", "500"],
});

export const metadata: Metadata = {
	title: `${studio.name} — ${studio.baseline}`,
	description: "Weddings in Malta. The house, the kitchen, the weekend — held, not subscribed.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={`${display.variable} ${body.variable}`}>
			<body className="min-h-dvh antialiased">{children}</body>
		</html>
	);
}
