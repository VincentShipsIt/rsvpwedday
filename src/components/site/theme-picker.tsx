"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SiteTheme } from "@/generated/prisma/enums";
import { themeChoices } from "@/lib/site-theme";

// `?pick=1` preview bar for comparing all five themes side by side. Deliberately styled the same
// regardless of the active theme (a fixed dark pill bar) rather than reading `--color-*`, since
// its whole job is comparing themes and it needs to stay legible over every one of them.
export function ThemePicker({ currentTheme }: { currentTheme: SiteTheme }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isCopied, setIsCopied] = useState(false);
	const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (copyTimeoutRef.current) {
				clearTimeout(copyTimeoutRef.current);
			}
		};
	}, []);

	function pushThemeParam(key: string) {
		const params = new URLSearchParams(searchParams.toString());
		params.set("theme", key);
		const hash = typeof window === "undefined" ? "" : window.location.hash;
		router.push(`/?${params.toString()}${hash}`);
	}

	async function handleShare() {
		if (typeof window === "undefined") {
			return;
		}
		await navigator.clipboard.writeText(window.location.href);
		setIsCopied(true);
		if (copyTimeoutRef.current) {
			clearTimeout(copyTimeoutRef.current);
		}
		copyTimeoutRef.current = setTimeout(() => setIsCopied(false), 1500);
	}

	return (
		<div
			className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2"
			style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
		>
			<div className="flex max-w-[calc(100vw-2rem)] items-center gap-2 overflow-x-auto rounded-full bg-black/80 px-2 py-2 text-white backdrop-blur">
				{themeChoices.map((choice) => (
					<button
						key={choice.key}
						type="button"
						onClick={() => pushThemeParam(choice.key)}
						className={`min-h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors ${
							choice.theme === currentTheme
								? "bg-white text-black"
								: "text-white/80 hover:bg-white/10"
						}`}
					>
						{choice.label}
					</button>
				))}
				<button
					type="button"
					onClick={handleShare}
					className="min-h-11 shrink-0 whitespace-nowrap rounded-full bg-white/10 px-4 text-sm font-medium text-white/80 hover:bg-white/20"
				>
					{isCopied ? "Copied" : "Share"}
				</button>
			</div>
		</div>
	);
}
