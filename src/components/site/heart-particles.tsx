/*
 * The moving half of the heart texture (the static scattered hearts are `.med-hearts` in
 * globals.css): a discreet layer of small blue outline hearts drifting up the whole page (MEDITERRANEAN). Fixed and
 * pointer-transparent, so it sits over every section without touching layout; the hearts are
 * few, small and translucent so they read as a hint rather than confetti. Positions, sizes and
 * timings are a fixed table rather than random, so server and client render identically. The
 * animation lives in globals.css (`.heart-particle`) and is removed under reduced motion.
 */
const hearts: { left: number; size: number; delay: number; duration: number; opacity: number }[] = [
	{ left: 4, size: 12, delay: 0, duration: 26, opacity: 0.38 },
	{ left: 13, size: 8, delay: 7, duration: 32, opacity: 0.3 },
	{ left: 22, size: 14, delay: 15, duration: 24, opacity: 0.35 },
	{ left: 31, size: 9, delay: 3, duration: 30, opacity: 0.28 },
	{ left: 40, size: 11, delay: 19, duration: 28, opacity: 0.35 },
	{ left: 49, size: 8, delay: 11, duration: 34, opacity: 0.3 },
	{ left: 58, size: 13, delay: 22, duration: 25, opacity: 0.38 },
	{ left: 67, size: 9, delay: 5, duration: 31, opacity: 0.28 },
	{ left: 76, size: 12, delay: 13, duration: 27, opacity: 0.35 },
	{ left: 85, size: 8, delay: 25, duration: 33, opacity: 0.3 },
	{ left: 93, size: 11, delay: 9, duration: 29, opacity: 0.35 },
];

export function HeartParticles() {
	return (
		<div aria-hidden="true" className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
			{hearts.map((heart) => (
				<svg
					key={heart.left}
					aria-hidden="true"
					viewBox="0 0 24 24"
					className="heart-particle absolute top-full"
					style={{
						left: `${heart.left}%`,
						width: heart.size,
						height: heart.size,
						opacity: heart.opacity,
						animationDelay: `${heart.delay}s`,
						animationDuration: `${heart.duration}s`,
					}}
				>
					{/* Same lopsided hand-drawn outline as the static tile in globals.css. */}
					<path
						d="M12.2 20.6c-1.8-1.3-7.9-5.4-9.4-9.2C1.4 8 3.6 5.2 6.4 5.4c2 .1 3.6 1.2 5.6 3.3 1.7-2.3 3.5-3.6 5.7-3.4 2.9.3 4.8 3.2 3.4 6.4-1.6 3.7-7.2 7.6-8.9 8.9Z"
						fill="none"
						stroke="#1d4f91"
						strokeWidth="1.8"
						strokeLinejoin="round"
						strokeLinecap="round"
					/>
				</svg>
			))}
		</div>
	);
}
