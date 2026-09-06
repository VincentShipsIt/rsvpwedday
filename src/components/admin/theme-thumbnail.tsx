"use client";

import { useEffect, useRef, useState } from "react";

/*
 * The thumbnail is the real landing page in an iframe rather than a hand-drawn miniature, so a
 * theme can never drift away from the card that sells it. The iframe is laid out at a fixed
 * desktop viewport and scaled down to whatever width the card happens to have, which is why the
 * scale factor needs a measurement instead of a CSS ratio.
 */
const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 800;

export function ThemeThumbnail({ themeKey, label }: { themeKey: string; label: string }) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(0);
	const [isInView, setIsInView] = useState(false);

	useEffect(() => {
		const node = containerRef.current;
		if (!node) {
			return;
		}

		const resizeObserver = new ResizeObserver((entries) => {
			const width = entries[0]?.contentRect.width ?? 0;
			setScale(width / FRAME_WIDTH);
		});
		resizeObserver.observe(node);

		// Six iframes of a database-backed page is a lot to fire at once, so each one waits until
		// its card is close to the viewport.
		const intersectionObserver = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					setIsInView(true);
					intersectionObserver.disconnect();
				}
			},
			{ rootMargin: "300px" }
		);
		intersectionObserver.observe(node);

		return () => {
			resizeObserver.disconnect();
			intersectionObserver.disconnect();
		};
	}, []);

	return (
		<div
			ref={containerRef}
			className="pointer-events-none relative aspect-[16/10] w-full overflow-hidden rounded-md border bg-muted"
		>
			{isInView && scale > 0 && (
				<iframe
					src={`/?theme=${themeKey}&preview=1`}
					title={`${label} theme preview`}
					tabIndex={-1}
					aria-hidden="true"
					scrolling="no"
					className="absolute left-0 top-0 origin-top-left border-0"
					style={{
						width: `${FRAME_WIDTH}px`,
						height: `${FRAME_HEIGHT}px`,
						transform: `scale(${scale})`,
					}}
				/>
			)}
		</div>
	);
}
