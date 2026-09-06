"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteTheme } from "@/generated/prisma/enums";
import { dataTheme } from "@/lib/site-theme";

const SESSION_KEY = "wed-invitation-opened";

// Short connector words dropped before taking initials, so "Anna & Mark" or "Anna and Mark"
// both resolve to "AM" instead of picking up a stray "A" from "and".
const CONNECTOR_WORDS = new Set(["and", "und", "the", "de", "di", "von", "van", "û", "u"]);

function getInitials(coupleNames: string): string {
	const words = coupleNames
		.split(/[^\p{L}]+/u)
		.map((word) => word.trim())
		.filter((word) => word.length > 0 && !CONNECTOR_WORDS.has(word.toLowerCase()));

	const [first, ...rest] = words;
	if (!first) {
		return "";
	}
	if (rest.length === 0) {
		return first.slice(0, 2).toUpperCase();
	}
	const last = words.at(-1) ?? first;
	return `${first[0]}${last[0]}`.toUpperCase();
}

/*
 * The first-load "closed invitation" cover (reference: thedigitalyes.com). It must never trap a
 * guest, so every escape hatch is real rather than cosmetic:
 * - `prefers-reduced-motion` skips it entirely (the effect below never arms `shouldShow`).
 * - It only mounts from a `useEffect`, so server HTML and a no-JS client never render it at all.
 * - `sessionStorage` remembers an opened cover so it doesn't reappear on the same visit.
 * - The button is autofocused and Escape opens it too, so a keyboard-only guest isn't stuck
 *   needing a pointer.
 */
export function InvitationOpening({
	coupleNames,
	theme,
	openLabel,
}: {
	coupleNames: string;
	theme: SiteTheme;
	openLabel: string;
}) {
	const [shouldShow, setShouldShow] = useState(false);
	const [isOpening, setIsOpening] = useState(false);
	const [isVisible, setIsVisible] = useState(true);
	const buttonRef = useRef<HTMLButtonElement>(null);

	const handleOpen = useCallback(() => {
		setIsOpening(true);
		try {
			sessionStorage.setItem(SESSION_KEY, "1");
		} catch {
			// Private browsing or storage disabled: opening still proceeds, it just won't be
			// remembered as "already seen" for the rest of the session.
		}
		window.setTimeout(() => setIsVisible(false), 900);
	}, []);

	useEffect(() => {
		const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (prefersReducedMotion) {
			return;
		}
		try {
			if (sessionStorage.getItem(SESSION_KEY)) {
				return;
			}
		} catch {
			// Storage disabled: still show the cover for this page view, see the comment above.
		}
		setShouldShow(true);
	}, []);

	useEffect(() => {
		if (!shouldShow || isOpening) {
			return;
		}
		buttonRef.current?.focus();

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				handleOpen();
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [shouldShow, isOpening, handleOpen]);

	if (!shouldShow || !isVisible || !coupleNames.trim()) {
		return null;
	}

	const initials = getInitials(coupleNames);

	return (
		<div
			data-theme={dataTheme[theme]}
			role="dialog"
			aria-modal="true"
			aria-label={coupleNames}
			className="fixed inset-0 z-50 flex overflow-hidden"
		>
			{/* Two solid, full-height "doors"; each carries its own faint paper texture on top of a
			    solid fill so the page behind is fully hidden at rest and genuinely revealed, not
			    just masked by a shared backdrop, once they slide apart. */}
			<div
				className={`w-1/2 border-r border-ink/10 bg-ivory bg-[radial-gradient(circle_at_80%_30%,rgb(224_200_140/0.35),transparent_55%)] transition-transform duration-[900ms] ease-in-out ${
					isOpening ? "-translate-x-full" : "translate-x-0"
				}`}
			/>
			<div
				className={`w-1/2 bg-ivory bg-[radial-gradient(circle_at_20%_70%,rgb(224_200_140/0.35),transparent_55%)] transition-transform duration-[900ms] ease-in-out ${
					isOpening ? "translate-x-full" : "translate-x-0"
				}`}
			/>
			<div
				className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center transition-opacity duration-300 ${
					isOpening ? "opacity-0" : "opacity-100"
				}`}
			>
				<svg aria-hidden="true" viewBox="0 0 96 96" className="h-20 w-20 text-green-dark">
					<circle cx="48" cy="48" r="42" fill="var(--color-gold)" opacity="0.9" />
					<circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="1.5" />
					<text
						x="48"
						y="58"
						textAnchor="middle"
						fill="var(--color-ivory)"
						fontSize="30"
						style={{ fontFamily: "var(--font-accent)" }}
					>
						{initials}
					</text>
				</svg>
				<h2 className="font-accent text-3xl text-ink sm:text-4xl">{coupleNames}</h2>
				<button
					ref={buttonRef}
					type="button"
					onClick={handleOpen}
					className="pointer-events-auto min-h-11 rounded-full border border-ink/20 bg-ivory px-6 text-sm uppercase tracking-widest text-ink transition-colors hover:bg-ivory-dark"
				>
					{openLabel}
				</button>
			</div>
		</div>
	);
}
