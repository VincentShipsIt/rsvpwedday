import Image from "next/image";
import { type RefObject, useState } from "react";

const POSTER = "/openings/mediterranean-bloom/poster.jpg";
const VIDEO = "/openings/mediterranean-bloom/opening.mp4";

export function MediterraneanArt({
	videoRef,
	initials,
	coupleNames,
	openLabel,
	ready,
	onOpen,
	onFinished,
}: {
	videoRef: RefObject<HTMLVideoElement | null>;
	initials: string;
	coupleNames: string;
	openLabel: string;
	ready: boolean;
	onOpen: () => void;
	onFinished: () => void;
}) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [showNames, setShowNames] = useState(false);

	return (
		<div className="opening-cinema" data-playing={isPlaying ? "" : undefined}>
			<div aria-hidden="true" className="opening-cinema-backdrop" />
			<div className="opening-cinema-stage">
				<video
					ref={videoRef}
					aria-hidden="true"
					tabIndex={-1}
					className="opening-cinema-video"
					src={VIDEO}
					poster={POSTER}
					muted
					playsInline
					preload="none"
					onPlaying={() => setIsPlaying(true)}
					onTimeUpdate={(event) => {
						const video = event.currentTarget;
						if (Number.isFinite(video.duration) && video.currentTime >= video.duration - 1) {
							setShowNames(true);
						}
					}}
					onEnded={onFinished}
					onError={onFinished}
				/>
				<Image
					className="opening-cinema-poster"
					src={POSTER}
					alt=""
					fill
					unoptimized
					priority
					sizes="(max-aspect-ratio: 9/16) 100vw, 56.25vh"
				/>
				<button
					type="button"
					className="opening-cinema-seal"
					data-opening-origin=""
					aria-label={openLabel}
					disabled={!ready}
					onClick={onOpen}
				>
					<span aria-hidden="true" className="opening-cinema-initials">
						{initials}
					</span>
				</button>
				<div
					aria-hidden="true"
					className="opening-cinema-names"
					data-visible={showNames ? "" : undefined}
					data-long-name={coupleNames.length > 35 ? "" : undefined}
				>
					{coupleNames}
				</div>
			</div>
		</div>
	);
}
