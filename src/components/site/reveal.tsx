"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
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

	return (
		<div
			ref={ref}
			className={`reveal ${isArmed ? "is-armed" : ""} ${isVisible ? "reveal-visible" : ""} ${className}`}
		>
			{children}
		</div>
	);
}
