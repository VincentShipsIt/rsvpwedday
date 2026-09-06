"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

// Wraps an `<Image fill>` block so it drifts a fraction of its distance from the viewport center
// as the page scrolls. `.parallax-inner` (globals.css) renders 130% tall so the translate never
// exposes an edge; reduced motion and `(hover: none)` touch devices get that same CSS collapsed
// back to a plain, untranslated frame, and this effect never attaches a listener for them.
export function Parallax({
	children,
	factor,
	className = "",
}: {
	children: ReactNode;
	/** Fraction of the element's scroll distance from viewport center to translate by, clamped to [0, 1]. */
	factor: number;
	className?: string;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const innerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const hasNoHover = window.matchMedia("(hover: none)").matches;
		if (prefersReducedMotion || hasNoHover) {
			return;
		}

		const clampedFactor = Math.min(Math.max(factor, 0), 1);
		let frameId = 0;

		function update() {
			frameId = 0;
			const container = containerRef.current;
			const inner = innerRef.current;
			if (!container || !inner) {
				return;
			}
			const rect = container.getBoundingClientRect();
			const viewportCenter = window.innerHeight / 2;
			const distance = rect.top + rect.height / 2 - viewportCenter;
			// The inner frame only has 15% of extra height on each side to move within before an
			// edge would show, so the shift is clamped to that budget regardless of `factor`.
			const maxShiftPx = rect.height * 0.15;
			const shift = Math.max(Math.min(distance * clampedFactor, maxShiftPx), -maxShiftPx);
			inner.style.transform = `translateY(${shift}px)`;
		}

		function onScroll() {
			if (frameId) {
				return;
			}
			frameId = requestAnimationFrame(update);
		}

		update();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			if (frameId) {
				cancelAnimationFrame(frameId);
			}
		};
	}, [factor]);

	return (
		<div ref={containerRef} className={`relative overflow-hidden ${className}`}>
			<div ref={innerRef} className="parallax-inner">
				{children}
			</div>
		</div>
	);
}
