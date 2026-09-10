/*
 * MONOGRAM cover art: the couple's initials as an SVG `<text>` whose outline is stroke-drawn
 * (a dash sweep over the glyph paths) inside a slowly turning dotted orbit and a ring that draws
 * itself while loading. Once ready, the initials are drawn one final time and filled; on open the
 * monogram scales away and the cover irises shut around it (`clip-path` on the cover root).
 */
export function MonogramArt({ initials }: { initials: string }) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 320 320"
			className="opening-monogram h-auto w-60 text-ink sm:w-72"
			fill="none"
		>
			<circle
				className="opening-monogram-orbit"
				cx="160"
				cy="160"
				r="148"
				stroke="currentColor"
				strokeOpacity="0.3"
				strokeDasharray="1 7"
				strokeLinecap="round"
			/>
			<circle
				className="opening-monogram-ring"
				cx="160"
				cy="160"
				r="128"
				stroke="var(--color-green)"
				strokeWidth="1.5"
				strokeLinecap="round"
				pathLength={100}
				transform="rotate(-90 160 160)"
			/>
			<g fill="var(--wed-secondary)">
				<path d="M160 6l4 6-4 6-4-6z" />
				<path d="M160 302l4 6-4 6-4-6z" />
				<path d="M6 160l6-4 6 4-6 4z" />
				<path d="M302 160l6-4 6 4-6 4z" />
			</g>
			<text
				className="opening-monogram-initials"
				x="160"
				y="204"
				textAnchor="middle"
				fontSize="128"
				fill="var(--color-green-dark)"
				stroke="var(--color-green-dark)"
				strokeWidth="1.2"
				strokeLinejoin="round"
				style={{ fontFamily: "var(--font-accent)" }}
			>
				{initials}
			</text>
		</svg>
	);
}
