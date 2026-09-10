import { Toaster } from "@rsvpwedday/ui/sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
	title: "Studio — Say Yes",
	robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={inter.variable}>
			<body className="min-h-dvh font-sans antialiased">
				{children}
				<Toaster />
			</body>
		</html>
	);
}
