import { useId } from "react";

const LEAVES = [
	[28, 142, -55],
	[36, 121, 38],
	[45, 103, -52],
	[59, 82, 35],
	[76, 65, -45],
	[98, 47, 40],
] as const;

function BotanicalSprig({ className }: { className: string }) {
	return (
		<svg aria-hidden="true" viewBox="0 0 160 190" fill="none" className={className}>
			<path d="M18 177C30 112 59 70 124 28M44 106 25 77M76 66 76 34" />
			{LEAVES.map(([x, y, angle]) => (
				<g key={y} transform={`translate(${x} ${y}) rotate(${angle})`}>
					<path d="M0 0C-13-9-12-29 0-39C12-27 12-10 0 0Z" fill="currentColor" fillOpacity="0.12" />
					<path d="M0 0V-31" strokeOpacity="0.45" />
				</g>
			))}
			{[0, 60, 120, 180, 240, 300].map((angle) => (
				<ellipse
					key={angle}
					cx="124"
					cy="18"
					rx="5"
					ry="10"
					transform={`rotate(${angle} 124 28)`}
					fill="var(--color-ivory)"
				/>
			))}
			<circle cx="124" cy="28" r="3" fill="currentColor" />
			<circle cx="25" cy="77" r="3" />
			<circle cx="76" cy="34" r="3" />
		</svg>
	);
}

export function SealArt({
	initials,
	coupleNames,
	openLabel,
	ready,
	onOpen,
}: {
	initials: string;
	coupleNames: string;
	openLabel: string;
	ready: boolean;
	onOpen: () => void;
}) {
	const id = useId();
	return (
		<div className="opening-letter">
			<BotanicalSprig className="opening-letter-sprig opening-letter-sprig-left" />
			<BotanicalSprig className="opening-letter-sprig opening-letter-sprig-right" />
			<div className="opening-letter-envelope">
				<div aria-hidden="true" className="opening-letter-back opening-letter-paper" />
				<div aria-hidden="true" className="opening-letter-lining" />
				<div aria-hidden="true" className="opening-letter-card opening-letter-paper">
					<div className="opening-letter-card-frame">
						<span className="opening-letter-card-ornament">✦</span>
						<span
							className={`opening-letter-card-names${coupleNames.length > 40 ? " opening-letter-card-names-long" : ""}`}
						>
							{coupleNames}
						</span>
						<svg
							aria-hidden="true"
							viewBox="0 0 120 24"
							fill="none"
							className="opening-letter-card-flourish"
						>
							<path
								d="M5 12h36m38 0h36M45 12c8-14 22 14 30 0-8-14-22 14-30 0Z"
								stroke="currentColor"
							/>
						</svg>
					</div>
				</div>
				<div aria-hidden="true" className="opening-letter-pocket opening-letter-paper">
					<BotanicalSprig className="opening-letter-engraving opening-letter-engraving-left" />
					<BotanicalSprig className="opening-letter-engraving opening-letter-engraving-right" />
					<svg
						aria-hidden="true"
						className="opening-letter-seams"
						viewBox="0 0 500 300"
						preserveAspectRatio="none"
						fill="none"
					>
						<path
							d="m0 0 250 162L500 0M0 300l183-121m134 0 183 121"
							stroke="currentColor"
							strokeOpacity="0.16"
						/>
					</svg>
				</div>
				{/* HTML carries the 3D fold; SVG children stay flat so Safari can paint both faces. */}
				<div aria-hidden="true" className="opening-letter-flap">
					<div className="opening-letter-flap-front opening-letter-paper" />
					<div className="opening-letter-flap-back opening-letter-lining" />
				</div>
				<button
					type="button"
					data-opening-origin=""
					className="opening-letter-seal"
					aria-label={openLabel}
					disabled={!ready}
					onClick={onOpen}
				>
					<svg aria-hidden="true" viewBox="0 0 120 120" fill="none">
						<defs>
							<radialGradient id={`${id}-wax`} cx="35%" cy="25%" r="80%">
								<stop stopColor="var(--color-green)" />
								<stop offset="1" stopColor="var(--color-green-dark)" />
							</radialGradient>
						</defs>
						<path
							d="M60 7C70 4 75 11 83 13S96 17 99 27 111 39 109 50 116 65 109 75 106 91 96 96 84 108 73 107 59 116 49 110 33 109 27 100 13 91 13 80 4 66 9 55 7 39 16 32 23 18 34 17 48 5 60 7Z"
							fill={`url(#${id}-wax)`}
						/>
						<circle
							cx="60"
							cy="60"
							r="40"
							stroke="var(--color-ivory)"
							strokeOpacity="0.4"
							strokeWidth="1.5"
						/>
						<circle cx="60" cy="60" r="36" stroke="var(--color-ivory)" strokeOpacity="0.25" />
						<path
							d="M36 79q24 14 48 0M36 40q24-14 48 0"
							stroke="var(--color-ivory)"
							strokeOpacity="0.45"
						/>
						<text
							x="60"
							y="70"
							textAnchor="middle"
							fill="var(--color-ivory)"
							fontSize="32"
							style={{ fontFamily: "var(--font-accent)" }}
						>
							{initials}
						</text>
					</svg>
				</button>
			</div>
		</div>
	);
}
