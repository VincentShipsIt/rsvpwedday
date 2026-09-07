/*
 * MEDITERRANEAN theme ornaments: a hand-drawn lemon sprig (two lemons, two leaves) and a single
 * small lemon glyph. Pure inline SVG that reads the theme's own tokens — lemon yellow from
 * `--color-gold`, leaf green from `--color-green-dark` — so no image asset ships with the theme
 * and the ornaments recolour with it.
 */
export function LemonSprig({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" viewBox="0 0 160 120" className={className}>
			<g transform="rotate(18 70 92)">
				<ellipse cx="70" cy="92" rx="24" ry="16" fill="var(--color-gold)" />
				<ellipse cx="93" cy="92" rx="4.5" ry="3.5" fill="var(--color-gold)" />
				<ellipse cx="62" cy="86" rx="8" ry="4" fill="#ffffff" opacity="0.28" />
			</g>
			<path
				d="M14 76C26 42 60 32 90 40C78 68 46 86 14 76Z"
				fill="var(--color-green-dark)"
				stroke="var(--color-ink)"
				strokeOpacity="0.12"
			/>
			<path
				d="M20 74C40 60 60 50 86 44"
				fill="none"
				stroke="var(--color-ivory)"
				strokeWidth="1.5"
				strokeLinecap="round"
				opacity="0.7"
			/>
			<g transform="rotate(-26 112 60)">
				<ellipse
					cx="112"
					cy="60"
					rx="32"
					ry="22"
					fill="var(--color-gold)"
					stroke="var(--color-ink)"
					strokeOpacity="0.12"
				/>
				<ellipse cx="143" cy="60" rx="5.5" ry="4.5" fill="var(--color-gold)" />
				<ellipse cx="102" cy="51" rx="11" ry="5.5" fill="#ffffff" opacity="0.3" />
			</g>
			<path
				d="M58 108C58 84 80 70 104 74C98 98 80 112 58 108Z"
				fill="var(--color-green-dark)"
				opacity="0.9"
				stroke="var(--color-ink)"
				strokeOpacity="0.12"
			/>
			<path
				d="M62 106C72 92 86 82 100 76"
				fill="none"
				stroke="var(--color-ivory)"
				strokeWidth="1.5"
				strokeLinecap="round"
				opacity="0.7"
			/>
		</svg>
	);
}

export function LemonGlyph({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" viewBox="0 0 40 32" className={className}>
			<path d="M4 22C8 10 20 8 28 12C22 22 12 26 4 22Z" fill="var(--color-green-dark)" />
			<g transform="rotate(-20 24 19)">
				<ellipse cx="24" cy="19" rx="11" ry="7.5" fill="var(--color-gold)" />
				<ellipse cx="34.5" cy="19" rx="2" ry="1.6" fill="var(--color-gold)" />
			</g>
		</svg>
	);
}
