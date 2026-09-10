import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const sans = Instrument_Sans({
	subsets: ["latin"],
	variable: "--font-sans",
});

const display = Instrument_Serif({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-display",
});

export const metadata: Metadata = {
	title: "Planning console — Say Yes",
	robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={`${sans.variable} ${display.variable}`}>
			<body className="min-h-dvh antialiased">{children}</body>
		</html>
	);
}
