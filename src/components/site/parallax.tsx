"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

/**
 * How the inner frame gets the headroom the drift needs.
 *
 * - `fill` wraps an `<Image fill>`: `.parallax-inner` is absolutely positioned 130% tall, so the
 *   image already overflows its fixed-aspect frame and only has to be translated.
 * - `flow` wraps an image that keeps its natural aspect ratio and so has no fixed frame to
 *   overflow. The headroom is a `scale(1.12)` on the inner instead, which is why it reads as a
 *   zoom *inside* the picture rather than the tile itself moving.
 */
export type ParallaxFit = "fill" | "flow";

// Fraction of the frame's height the inner may be shifted by before an edge would show, per fit:
// `fill`'s 130% leaves 15% on each side, `flow`'s scale(1.12) leaves 6%.
const shiftBudget: Record<ParallaxFit, number> = { fill: 0.15, flow: 0.06 };

// Wraps an image block so it drifts a fraction of its distance from the viewport center as the
// page scrolls — the frame itself never moves. Reduced motion and `(hover: none)` touch devices
// get the same CSS collapsed back to a plain, untransformed frame, and this effect never attaches
// a listener for them, so the two can't disagree about whether the headroom is there.
export function Parallax({
	children,
	factor,
	fit = "fill",
	className = "",
}: {
	children: ReactNode;
	/** Fraction of the element's scroll distance from viewport center to translate by, clamped to [0, 1]. */
	factor: number;
	fit?: ParallaxFit;
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
		const budget = shiftBudget[fit];
		// `flow` keeps its CSS zoom in the inline transform, since setting `transform` at all would
		// otherwise drop the stylesheet's `scale(1.12)` and expose an edge on the first frame.
		const scaleSuffix = fit === "flow" ? " scale(1.12)" : "";
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
			const maxShiftPx = rect.height * budget;
			const shift = Math.max(Math.min(distance * clampedFactor, maxShiftPx), -maxShiftPx);
			inner.style.transform = `translateY(${shift}px)${scaleSuffix}`;
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
	}, [factor, fit]);

	return (
		<div ref={containerRef} className={`relative overflow-hidden ${className}`}>
			<div ref={innerRef} className={fit === "flow" ? "parallax-inner-flow" : "parallax-inner"}>
				{children}
			</div>
		</div>
	);
}
