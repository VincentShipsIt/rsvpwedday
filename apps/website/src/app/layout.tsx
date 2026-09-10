import type { Metadata } from "next";
import { Source_Serif_4, Syne } from "next/font/google";
import type { ReactNode } from "react";
import { studio } from "@/lib/brand";
import "./globals.css";

const display = Syne({
	subsets: ["latin"],
	variable: "--font-display",
	weight: ["500", "600", "700", "800"],
});

const body = Source_Serif_4({
	subsets: ["latin"],
	variable: "--font-body",
	style: ["normal", "italic"],
});

export const metadata: Metadata = {
	title: `${studio.name} — destination wedding planning`,
	description:
		"Full-service destination planning. Each household gets a private site, RSVP, album and gifts — on their own domain.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={`${display.variable} ${body.variable}`}>
			<body className="min-h-dvh antialiased">
				<div className="grain" aria-hidden="true" />
				{children}
			</body>
		</html>
	);
}
