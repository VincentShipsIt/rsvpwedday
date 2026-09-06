"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export type RevealVariant = "rise" | "fade" | "scale";

export function Reveal({
	children,
	className = "",
	delay = 0,
	variant = "rise",
}: {
	children: ReactNode;
	className?: string;
	/** Stagger delay in milliseconds, applied as a transition-delay once revealed. */
	delay?: number;
	variant?: RevealVariant;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(false);
	// Starts unarmed so server HTML and no-JS clients show content in place; the effect arms the
	// hidden initial state only once React has mounted and can guarantee the observer will run.
	const [isArmed, setIsArmed] = useState(false);

	useEffect(() => {
		const node = ref.current;
		if (!node) {
			return;
		}

		setIsArmed(true);

		// `rootMargin` extends the intersection root 20% past the real viewport bottom, and the
		// near-zero `threshold` accepts the first visible pixel rather than requiring 15% of the
		// target's own area. Without both, a tall single-column tile (the Gallery masonry grid
		// collapses to one column below `sm`) needs a long scroll past its top edge before 15% of
		// its own height clears the viewport, so it sits at `opacity: 0` — visually "empty" behind
		// its own frame/border — for much longer than the short sections this component was tuned
		// against (Story milestones, Event cards).
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.01, rootMargin: "0px 0px 20% 0px" }
		);
		observer.observe(node);

		return () => observer.disconnect();
	}, []);

	const style = delay ? ({ transitionDelay: `${delay}ms` } satisfies CSSProperties) : undefined;

	return (
		<div
			ref={ref}
			style={style}
			className={`reveal reveal-${variant} ${isArmed ? "is-armed" : ""} ${isVisible ? "reveal-visible" : ""} ${className}`}
		>
			{children}
		</div>
	);
}
