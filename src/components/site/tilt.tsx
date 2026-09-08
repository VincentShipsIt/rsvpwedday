"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

/** Must match `.tilt[data-tilt-state="settling"]`'s transition in globals.css. */
const SETTLE_MS = 500;

/*
 * Tips a card towards the pointer: the rotation is the pointer's offset from the card's own
 * centre, so the corner under the cursor lifts and the opposite one falls away. The card follows
 * the hand rather than playing a canned animation, which is the whole difference between this and
 * a static `rotate-1`.
 *
 * The transform lives on this wrapper and nowhere else, which is what lets it compose with
 * everything else already moving on these cards: `Reveal` transforms its own element above,
 * Tailwind's polaroid `rotate-*` uses the independent `rotate` property, and `Parallax` only ever
 * writes to `.parallax-inner` below.
 *
 * `data-tilt-state` is what carries the transform, and it is absent when the card is at rest —
 * deliberately. A permanent `perspective()` would keep every card in its own composited layer and
 * resample the text through it for the whole visit; a card nobody is pointing at should be plain
 * flat type. That is also why the attribute outlives the pointer by one settle: the card has to
 * still own a transform while it falls back level.
 */
export function Tilt({
	children,
	className = "",
	/** Maximum rotation in degrees at the card's edge. */
	max = 7,
}: {
	children: ReactNode;
	className?: string;
	max?: number;
}) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const node = ref.current;
		if (!node) {
			return;
		}
		// The same bail-out `Parallax` makes, and for the same reasons: a tilt has no meaning
		// without a pointer, and it is exactly the kind of motion reduced motion asks us to drop.
		if (
			window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
			window.matchMedia("(hover: none)").matches
		) {
			return;
		}

		let frameId = 0;
		let settleTimer = 0;
		let pendingEvent: PointerEvent | null = null;

		const applyPending = () => {
			frameId = 0;
			const event = pendingEvent;
			pendingEvent = null;
			if (!event) {
				return;
			}
			const rect = node.getBoundingClientRect();
			if (rect.width === 0 || rect.height === 0) {
				return;
			}
			// -0.5 at the left/top edge, +0.5 at the right/bottom one.
			const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
			const offsetY = (event.clientY - rect.top) / rect.height - 0.5;
			// `rotateX` positive tips the top away and `rotateY` positive tips the right away, so
			// both are signed to bring the edge nearest the pointer forward instead.
			node.style.setProperty("--tilt-x", `${offsetY * 2 * max}deg`);
			node.style.setProperty("--tilt-y", `${-offsetX * 2 * max}deg`);
		};

		const handlePointerMove = (event: PointerEvent) => {
			window.clearTimeout(settleTimer);
			node.dataset.tiltState = "tracking";
			pendingEvent = event;
			if (!frameId) {
				frameId = requestAnimationFrame(applyPending);
			}
		};

		const handlePointerLeave = () => {
			if (frameId) {
				cancelAnimationFrame(frameId);
				frameId = 0;
			}
			pendingEvent = null;
			node.dataset.tiltState = "settling";
			node.style.setProperty("--tilt-x", "0deg");
			node.style.setProperty("--tilt-y", "0deg");
			// Dropping the attribute takes the transform — and the composited layer with it — off a
			// card nobody is pointing at, but only once it is level again.
			settleTimer = window.setTimeout(() => {
				delete node.dataset.tiltState;
				node.style.removeProperty("--tilt-x");
				node.style.removeProperty("--tilt-y");
			}, SETTLE_MS + 40);
		};

		node.addEventListener("pointermove", handlePointerMove);
		node.addEventListener("pointerleave", handlePointerLeave);
		return () => {
			node.removeEventListener("pointermove", handlePointerMove);
			node.removeEventListener("pointerleave", handlePointerLeave);
			window.clearTimeout(settleTimer);
			if (frameId) {
				cancelAnimationFrame(frameId);
			}
		};
	}, [max]);

	return (
		<div ref={ref} className={`tilt ${className}`}>
			{children}
		</div>
	);
}
