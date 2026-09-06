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

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.15 }
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
