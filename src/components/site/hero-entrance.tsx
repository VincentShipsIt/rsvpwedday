"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

// Mirrors `Reveal`'s arming pattern for the hero's on-load entrance: server HTML and no-JS
// clients render every child in place, and only a mounted client adds `.is-armed`, which is what
// lets the `.hero-entrance-item` children (globals.css) animate at all.
export function HeroEntrance({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}) {
	const [isArmed, setIsArmed] = useState(false);

	useEffect(() => {
		setIsArmed(true);
	}, []);

	return (
		<div className={`${isArmed ? "is-armed" : ""} hero-entrance ${className}`}>{children}</div>
	);
}
