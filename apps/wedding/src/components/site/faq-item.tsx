"use client";

import type { MouseEvent, ReactNode } from "react";
import { useEffect, useRef } from "react";

const DURATION_MS = 340;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

/*
 * One question in the FAQ accordion.
 *
 * The element stays a real `<details>`: keyboard and screen-reader behaviour, `#anchor` linking
 * and the no-JS fallback are the browser's, not ours. All this adds is the height animation,
 * which the native element cannot do on its own because it drops its content out of the layout
 * the instant `open` flips. So the toggle is taken over: opening sets `open` first and grows the
 * answer from nothing, closing shrinks it and only then unsets `open`, so the answer is still
 * laid out for the whole transition.
 *
 * The answer arrives as `children` so `RichText`'s sanitiser stays on the server, the same way
 * the gift cards keep it out of a guest's bundle.
 */
export function FaqItem({ question, children }: { question: string; children: ReactNode }) {
	const detailsRef = useRef<HTMLDetailsElement>(null);
	const answerRef = useRef<HTMLDivElement>(null);
	const animationRef = useRef<Animation | null>(null);
	const settleTimerRef = useRef(0);

	useEffect(() => () => window.clearTimeout(settleTimerRef.current), []);

	function handleToggleClick(event: MouseEvent<HTMLElement>) {
		const details = detailsRef.current;
		const answer = answerRef.current;
		if (!details || !answer) {
			return;
		}
		// Without `Element.animate`, or for a guest who asked for less motion, the click is left
		// alone and `<details>` opens and closes the way it always has.
		if (
			typeof answer.animate !== "function" ||
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		) {
			return;
		}
		event.preventDefault();

		// Read the height a click into a running animation interrupts before cancelling it, so a
		// reversal starts from where the answer actually is rather than snapping to full height.
		const startHeight = answer.getBoundingClientRect().height;
		window.clearTimeout(settleTimerRef.current);
		animationRef.current?.cancel();

		const isOpening = !details.open;
		details.classList.toggle("faq-closing", !isOpening);
		if (isOpening) {
			details.open = true;
		}
		const endHeight = isOpening ? answer.scrollHeight : 0;

		answer.style.overflow = "hidden";
		const animation = answer.animate(
			{
				height: [`${startHeight}px`, `${endHeight}px`],
				opacity: isOpening ? [0, 1] : [1, 0],
			},
			{ duration: DURATION_MS, easing: EASING }
		);
		animationRef.current = animation;

		/*
		 * Putting the element back the way the animation left it. This is where a close actually
		 * completes, so it cannot be allowed to not happen: `finish` is dispatched only during a
		 * rendering update, and a tab in the background — or any document the browser has stopped
		 * painting — never gets one, which would strand the answer open with its chevron pointing
		 * the wrong way. The timer always fires, so it is the guarantee and the event is only the
		 * fast path; the body runs once for whichever arrives first, and not at all for an
		 * animation a later click has already superseded.
		 */
		const settle = () => {
			if (animationRef.current !== animation) {
				return;
			}
			window.clearTimeout(settleTimerRef.current);
			animationRef.current = null;
			answer.style.overflow = "";
			if (!isOpening) {
				details.open = false;
				details.classList.remove("faq-closing");
			}
		};

		animation.addEventListener("finish", settle);
		settleTimerRef.current = window.setTimeout(settle, DURATION_MS + 80);
	}

	return (
		<details ref={detailsRef} className="group py-4">
			{/* biome-ignore lint/a11y/noStaticElementInteractions: `<summary>` is natively interactive — focusable, and it turns Enter and Space into this same click event — so adding a role would only fight the element's own semantics. */}
			<summary
				onClick={handleToggleClick}
				className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg [&::-webkit-details-marker]:hidden"
			>
				<span>{question}</span>
				<svg
					aria-hidden="true"
					viewBox="0 0 20 20"
					className="faq-chevron h-4 w-4 shrink-0 text-green"
				>
					<path
						fill="currentColor"
						d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.23 8.29a.75.75 0 0 1 0-1.08Z"
					/>
				</svg>
			</summary>
			<div ref={answerRef}>{children}</div>
		</details>
	);
}
