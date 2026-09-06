"use client";

import { useEffect } from "react";

// `Countdown` (and a few other client-mounted pieces) render nothing during SSR and insert real
// height right after mount, pushing every section below Hero further down the page. The browser's
// one-time scroll-to-`#hash` on initial load can run before that settles, so a deep link like
// `#gallery` lands short of the section. Re-running the scroll once layout has caught up —
// `scrollIntoView` honors each section's own `scroll-mt-[var(--wed-nav-height)]` — corrects for it.
export function HashScrollFix() {
	useEffect(() => {
		const hash = window.location.hash;
		if (!hash) {
			return;
		}

		const target = document.getElementById(hash.slice(1));
		if (!target) {
			return;
		}

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				target.scrollIntoView();
			});
		});
	}, []);

	return null;
}
