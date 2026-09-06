"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

// `SiteNav` itself stays a server component; this is the one bit of scroll-tracking state it
// needs, isolated the same way `NavMobileMenu` isolates its own client state. Toggling a class
// (rather than re-rendering styles) means no layout shift when the bar crosses the threshold.
export function StickyHeader({
	children,
	className,
	dataTheme,
}: {
	children: ReactNode;
	className: string;
	dataTheme: string;
}) {
	const ref = useRef<HTMLElement>(null);

	useEffect(() => {
		function handleScroll() {
			ref.current?.classList.toggle("nav-scrolled", window.scrollY > 24);
		}

		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<header ref={ref} data-theme={dataTheme} data-nav className={className}>
			{children}
		</header>
	);
}
