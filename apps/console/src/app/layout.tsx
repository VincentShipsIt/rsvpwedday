import type { Metadata } from "next";
import { Source_Serif_4, Syne } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const display = Syne({
	subsets: ["latin"],
	variable: "--font-syne",
	weight: ["500", "600", "700", "800"],
});

const body = Source_Serif_4({
	subsets: ["latin"],
	variable: "--font-source",
	style: ["normal", "italic"],
});

export const metadata: Metadata = {
	title: "Planning console — Say Yes",
	robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={`${display.variable} ${body.variable}`}>
			<body className="min-h-dvh font-sans antialiased">{children}</body>
		</html>
	);
}
