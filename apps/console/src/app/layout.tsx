import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const sans = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

export const metadata: Metadata = {
	title: "Planning console — Say Yes",
	robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={sans.variable}>
			<body className="min-h-dvh font-sans antialiased">{children}</body>
		</html>
	);
}
