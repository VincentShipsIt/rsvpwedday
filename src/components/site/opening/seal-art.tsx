/*
 * SEAL cover art: a closed envelope with a wax seal at the flap's tip. Every moving part is a
 * 2D transform (Safari can't 3D-transform SVG children), animated by phase from `globals.css`:
 * the ring around the seal sweeps while loading, then on open the seal pops, the flap flips up
 * around its fold (`scaleY(-1)` at the fold line), the card rises out, and the doors part.
 *
 * Paint order matters: the flap sits *behind* the card and pocket so that, once flipped up, the
 * rising card passes in front of it. At rest the flap and pocket are exact complements of the
 * envelope rectangle, and the card starts fully inside the pocket polygon, so nothing overlaps
 * wrongly before the animation runs.
 */
export function SealArt({ initials }: { initials: string }) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 -30 320 290"
			className="opening-seal h-auto w-64 text-ink sm:w-80"
			fill="none"
		>
			<rect
				x="20"
				y="70"
				width="280"
				height="160"
				rx="6"
				fill="var(--color-ivory-dark)"
				stroke="currentColor"
				strokeOpacity="0.2"
			/>
			<path
				className="opening-seal-flap"
				d="M20 70 L160 160 L300 70 Z"
				fill="var(--color-ivory)"
				stroke="currentColor"
				strokeOpacity="0.2"
				strokeLinejoin="round"
			/>
			<g className="opening-seal-card">
				<rect
					x="50"
					y="165"
					width="220"
					height="62"
					rx="3"
					fill="var(--color-ivory)"
					stroke="currentColor"
					strokeOpacity="0.15"
				/>
				<path
					d="M110 188h100M128 204h64"
					stroke="currentColor"
					strokeOpacity="0.25"
					strokeLinecap="round"
				/>
			</g>
			<path
				d="M20 70 L160 160 L300 70 L300 230 L20 230 Z"
				fill="var(--color-ivory)"
				stroke="currentColor"
				strokeOpacity="0.2"
				strokeLinejoin="round"
			/>
			<path d="M20 230 L140 148 M300 230 L180 148" stroke="currentColor" strokeOpacity="0.12" />
			<g className="opening-seal-wax">
				<circle
					className="opening-seal-ring"
					cx="160"
					cy="160"
					r="40"
					stroke="var(--wed-secondary)"
					strokeWidth="1.5"
					strokeLinecap="round"
					pathLength={100}
					transform="rotate(-90 160 160)"
				/>
				<circle cx="160" cy="160" r="30" fill="var(--color-green)" />
				<circle
					cx="160"
					cy="160"
					r="24"
					stroke="var(--color-ivory)"
					strokeOpacity="0.5"
					strokeDasharray="2 3"
				/>
				<text
					x="160"
					y="168"
					textAnchor="middle"
					fill="var(--color-ivory)"
					fontSize="22"
					style={{ fontFamily: "var(--font-accent)" }}
				>
					{initials}
				</text>
			</g>
		</svg>
	);
}
