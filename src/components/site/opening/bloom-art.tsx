import type { CSSProperties } from "react";

/*
 * BLOOM cover art: two mirrored botanical branches that grow up from the bottom centre, leaves
 * drawing in along them and blossoms scaling open at the tips, framing the couple's names in the
 * middle. Everything is stroke-drawn (`pathLength="100"` + dash offset, same trick as the garden
 * section divider) and staggered through `--draw-delay`; on open the blossoms burst, loose petals
 * fly out, and the whole cover lifts away like a curtain.
 */

const WIDTH = 420;

// Left-hand branch only; the right-hand side is mirrored across the centre line.
const BRANCH = "M210 292 C 150 270, 90 230, 72 150 S 90 60, 140 40";

// [x, y, rotation] for each leaf on the left branch, ordered base to tip so the draw stagger
// follows the branch's own growth.
const LEAVES: [number, number, number][] = [
	[176, 284, -120],
	[152, 274, 40],
	[126, 258, -125],
	[104, 238, 30],
	[88, 210, -140],
	[78, 178, 15],
	[72, 146, -165],
	[76, 112, -10],
	[88, 82, -180],
	[108, 56, -30],
];

// [x, y, scale] blossoms, again left side only.
const BLOSSOMS: [number, number, number][] = [
	[140, 40, 1],
	[72, 150, 0.8],
	[116, 250, 0.65],
];

// Loose petals flung outward on open: direction as a unit-ish vector plus a spin, deterministic
// so the same petal always takes the same path (nothing here should depend on `Math.random`).
const PETALS = [
	[-1, -0.6, -160],
	[1, -0.7, 140],
	[-0.7, -1, 90],
	[0.8, -1, -110],
	[-1, 0.2, 200],
	[1, 0.1, -180],
	[-0.5, 0.9, 120],
	[0.6, 0.9, -90],
] as const;

function drawDelay(seconds: number): CSSProperties {
	return { "--draw-delay": `${seconds}s` } as CSSProperties;
}

function Branch({ mirrored }: { mirrored: boolean }) {
	const flip = mirrored ? `translate(${WIDTH} 0) scale(-1 1)` : undefined;
	return (
		<g transform={flip}>
			<path
				className="opening-bloom-branch"
				d={BRANCH}
				stroke="var(--color-green)"
				strokeWidth="1.6"
				strokeLinecap="round"
				pathLength={100}
			/>
			{LEAVES.map(([x, y, rotation], index) => (
				<path
					key={`${x}-${y}`}
					className="opening-bloom-leaf"
					d="M0 0 C 7 -8 7 -20 0 -28 C -7 -20 -7 -8 0 0 Z"
					transform={`translate(${x} ${y}) rotate(${rotation})`}
					fill="var(--color-green)"
					stroke="var(--color-green)"
					strokeWidth="1"
					strokeLinejoin="round"
					pathLength={100}
					style={drawDelay(0.3 + index * 0.12)}
				/>
			))}
			{BLOSSOMS.map(([x, y, scale], index) => (
				<g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${scale})`}>
					<g className="opening-bloom-blossom" style={drawDelay(1.2 + index * 0.25)}>
						{[0, 72, 144, 216, 288].map((angle) => (
							<ellipse
								key={angle}
								cx="0"
								cy="-8"
								rx="4.5"
								ry="8"
								transform={`rotate(${angle})`}
								fill="var(--color-rose)"
								fillOpacity="0.9"
							/>
						))}
						<circle r="2.6" fill="var(--color-ivory)" />
					</g>
				</g>
			))}
		</g>
	);
}

export function BloomArt() {
	return (
		<>
			<svg
				aria-hidden="true"
				viewBox={`0 0 ${WIDTH} 320`}
				className="opening-bloom h-auto w-80 sm:w-[26rem]"
				fill="none"
			>
				<Branch mirrored={false} />
				<Branch mirrored />
			</svg>
			<div aria-hidden="true" className="pointer-events-none absolute inset-0">
				{PETALS.map(([dx, dy, spin], index) => (
					<svg
						key={`${dx}-${dy}`}
						aria-hidden="true"
						viewBox="0 0 12 20"
						className="opening-bloom-petal absolute left-1/2 top-1/2 h-5 w-3"
						style={
							{
								"--fly-x": `${dx * 42}vmin`,
								"--fly-y": `${dy * 42}vmin`,
								"--fly-spin": `${spin}deg`,
								"--fly-delay": `${index * 0.03}s`,
							} as CSSProperties
						}
					>
						<path d="M6 0 C 11 6 11 14 6 20 C 1 14 1 6 6 0 Z" fill="var(--color-rose)" />
					</svg>
				))}
			</div>
		</>
	);
}
