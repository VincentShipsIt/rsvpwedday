/*
 * MEDITERRANEAN theme ornaments: a hand-drawn lemon sprig (two lemons, two leaves) and a single
 * small lemon glyph. Pure inline SVG that reads the theme's own tokens — lemon yellow from
 * `--color-gold`, leaf green from `--color-green-dark` — so no image asset ships with the theme
 * and the ornaments recolour with it.
 */
export function LemonSprig({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" viewBox="0 0 200 140" className={className}>
			{/* One branch, two leaves on it, two lemons hanging off it: drawn back to front so the
			    leaves overlap the fruit the way a real sprig does. */}
			<path
				d="M12 128C60 110 110 70 165 28"
				fill="none"
				stroke="var(--color-green-dark)"
				strokeWidth="3"
				strokeLinecap="round"
			/>
			<path
				d="M118 58C112 32 140 14 166 22 158 46 138 60 118 58Z"
				fill="var(--color-green-dark)"
				stroke="var(--color-ink)"
				strokeOpacity="0.12"
			/>
			<path
				d="M120 56C134 42 150 30 164 24"
				fill="none"
				stroke="var(--color-ivory)"
				strokeWidth="1.5"
				strokeLinecap="round"
				opacity="0.7"
			/>
			<g transform="rotate(-20 150 84)">
				<ellipse
					cx="150"
					cy="84"
					rx="24"
					ry="17"
					fill="var(--color-gold)"
					stroke="var(--color-ink)"
					strokeOpacity="0.12"
				/>
				<ellipse cx="173" cy="84" rx="4.5" ry="3.5" fill="var(--color-gold)" />
				<ellipse cx="142" cy="77" rx="8" ry="4" fill="#ffffff" opacity="0.3" />
			</g>
			<g transform="rotate(-32 96 98)">
				<ellipse
					cx="96"
					cy="98"
					rx="31"
					ry="22"
					fill="var(--color-gold)"
					stroke="var(--color-ink)"
					strokeOpacity="0.12"
				/>
				<ellipse cx="126" cy="98" rx="5.5" ry="4.5" fill="var(--color-gold)" />
				<ellipse cx="86" cy="89" rx="11" ry="5.5" fill="#ffffff" opacity="0.3" />
			</g>
			<path
				d="M52 110C40 80 70 62 96 70 88 96 66 112 52 110Z"
				fill="var(--color-green-dark)"
				stroke="var(--color-ink)"
				strokeOpacity="0.12"
			/>
			<path
				d="M54 108C66 90 80 78 94 72"
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
