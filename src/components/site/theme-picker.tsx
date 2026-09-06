"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import type { SiteTheme } from "@/generated/prisma/enums";
import { themeChoices } from "@/lib/site-theme";

// `?pick=1` preview control for comparing all six themes. Deliberately styled the same regardless
// of the active theme (a fixed dark trigger/listbox) rather than reading `--color-*`, since its
// whole job is comparing themes and it needs to stay legible over every one of them. A compact
// dropdown rather than a bar of six buttons: the bar clipped its last option on a phone once a
// sixth theme (Vintage) was added.
export function ThemePicker({ currentTheme }: { currentTheme: SiteTheme }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const listboxId = useId();
	const [isCopied, setIsCopied] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [openDirection, setOpenDirection] = useState<"up" | "down">("up");
	const currentIndex = Math.max(
		themeChoices.findIndex((choice) => choice.theme === currentTheme),
		0
	);
	const [activeIndex, setActiveIndex] = useState(currentIndex);
	const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

	useEffect(() => {
		return () => {
			if (copyTimeoutRef.current) {
				clearTimeout(copyTimeoutRef.current);
			}
		};
	}, []);

	// Dismiss on outside click. Only attached while open, so a closed picker adds no listener.
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		function handlePointerDown(event: MouseEvent) {
			if (!containerRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handlePointerDown);
		return () => document.removeEventListener("mousedown", handlePointerDown);
	}, [isOpen]);

	// Moves focus onto the highlighted option whenever the list opens or arrow keys move the
	// highlight, which is what makes arrow-key navigation actually visible/usable to a keyboard user.
	useEffect(() => {
		if (isOpen) {
			optionRefs.current[activeIndex]?.focus();
		}
	}, [isOpen, activeIndex]);

	function pushThemeParam(key: string) {
		const params = new URLSearchParams(searchParams.toString());
		params.set("theme", key);
		const hash = typeof window === "undefined" ? "" : window.location.hash;
		router.push(`/?${params.toString()}${hash}`);
	}

	function toggleOpen() {
		if (!isOpen) {
			// The picker sits pinned near the bottom of the viewport, so there is usually no room
			// to open downward without clipping against the bottom edge; measure the real space
			// left rather than assuming, so it still opens downward on a viewport tall enough for it.
			const estimatedListboxHeight = 260;
			const spaceBelow = triggerRef.current
				? window.innerHeight - triggerRef.current.getBoundingClientRect().bottom
				: 0;
			setOpenDirection(spaceBelow < estimatedListboxHeight ? "up" : "down");
			setActiveIndex(currentIndex);
		}
		setIsOpen((current) => !current);
	}

	function selectTheme(index: number) {
		setIsOpen(false);
		triggerRef.current?.focus();
		pushThemeParam(themeChoices[index].key);
	}

	function handleListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setActiveIndex((current) => (current + 1) % themeChoices.length);
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			setActiveIndex((current) => (current - 1 + themeChoices.length) % themeChoices.length);
		} else if (event.key === "Home") {
			event.preventDefault();
			setActiveIndex(0);
		} else if (event.key === "End") {
			event.preventDefault();
			setActiveIndex(themeChoices.length - 1);
		} else if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			selectTheme(activeIndex);
		} else if (event.key === "Escape") {
			event.preventDefault();
			setIsOpen(false);
			triggerRef.current?.focus();
		} else if (event.key === "Tab") {
			setIsOpen(false);
		}
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

	const currentChoice = themeChoices[currentIndex];

	return (
		<div
			ref={containerRef}
			className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2"
			style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
		>
			<div className="relative flex items-center gap-2">
				<button
					ref={triggerRef}
					type="button"
					aria-haspopup="listbox"
					aria-expanded={isOpen}
					aria-controls={listboxId}
					onClick={toggleOpen}
					className="flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-black/80 px-4 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-black/90"
				>
					{currentChoice.label}
					<svg
						aria-hidden="true"
						viewBox="0 0 20 20"
						className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
					>
						<path
							fill="currentColor"
							d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.23 8.29a.75.75 0 0 1 0-1.08Z"
						/>
					</svg>
				</button>
				<button
					type="button"
					onClick={handleShare}
					className="min-h-11 shrink-0 whitespace-nowrap rounded-full bg-white/10 px-4 text-sm font-medium text-white/80 backdrop-blur hover:bg-white/20"
				>
					{isCopied ? "Copied" : "Share"}
				</button>
				{isOpen && (
					<div
						id={listboxId}
						role="listbox"
						aria-label="Theme"
						aria-activedescendant={`${listboxId}-${activeIndex}`}
						tabIndex={-1}
						onKeyDown={handleListKeyDown}
						className={`absolute left-0 flex max-h-[60vh] w-44 flex-col gap-0.5 overflow-y-auto rounded-2xl bg-black/90 p-1.5 text-white backdrop-blur ${
							openDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"
						}`}
					>
						{themeChoices.map((choice, index) => (
							<button
								key={choice.key}
								id={`${listboxId}-${index}`}
								ref={(element) => {
									optionRefs.current[index] = element;
								}}
								type="button"
								role="option"
								aria-selected={choice.theme === currentTheme}
								tabIndex={index === activeIndex ? 0 : -1}
								onClick={() => selectTheme(index)}
								onMouseEnter={() => setActiveIndex(index)}
								className={`min-h-11 shrink-0 rounded-xl px-4 text-left text-sm font-medium transition-colors ${
									choice.theme === currentTheme
										? "bg-white text-black"
										: "text-white/80 hover:bg-white/10"
								}`}
							>
								{choice.label}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
