"use client";

import Image from "next/image";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { BloomArt } from "@/components/site/opening/bloom-art";
import { getInitials } from "@/components/site/opening/initials";
import { MediterraneanArt } from "@/components/site/opening/mediterranean-art";
import { MonogramArt } from "@/components/site/opening/monogram-art";
import { SealArt } from "@/components/site/opening/seal-art";
import { OpeningAnimation, type SiteTheme } from "@/generated/prisma/enums";
import { dataOpening } from "@/lib/site-effects";
import { dataTheme } from "@/lib/site-theme";

// Fired on `window` the moment a guest opens the cover, from inside their click, so
// `MusicToggle` can start the track while the browser still counts it as a user gesture and
// `Particles` can burst from the cover art. Also fired (without a detail, on the next tick) when
// the cover is skipped because this session already opened it, so the page still gets its
// ambient burst.
export const INVITATION_OPENED_EVENT = "wed:invitation-opened";

/** Viewport centre of the cover art the guest just opened; absent when the cover was skipped. */
export type InvitationOpenedDetail = { x: number; y: number } | undefined;

const SESSION_KEY = "wed-invitation-opened";

// The cover doubles as the page's loading screen: it waits for the fonts and the hero photo
// before offering the button, but never for longer than this (plus the admin's hold time), so a
// slow image can't hold a guest at the door.
const MAX_LOADING_MS = 4000;

type Phase = "loading" | "ready" | "opening";

type CoverAnimation = Exclude<OpeningAnimation, typeof OpeningAnimation.NONE>;

// How long each open transition runs, at 100% speed, before the cover unmounts. Must cover the
// longest chain in that variant's `[data-phase="opening"]` CSS: its own art animation, then the
// shared split (delay + 0.9s), or the seal’s dissolve (2.45s + 0.8s).
// The film's duration only sizes its watchdog; the media's ended event starts its dissolve.
const revealMs: Record<CoverAnimation, number> = {
	[OpeningAnimation.SEAL]: 3300,
	[OpeningAnimation.MONOGRAM]: 1300,
	[OpeningAnimation.BLOOM]: 1600,
	[OpeningAnimation.MEDITERRANEAN_BLOOM]: 5000,
};

// The cover ground is cut into four quadrants that each slide out to their own corner on open,
// so the page underneath appears along a vertical and a horizontal seam at once. Each panel
// clips a viewport-sized copy of the full ground (theme texture + ghosted hero photo) anchored to
// its corner, so the four pieces line up into one picture at rest; the panels overlap by 1px so
// subpixel rounding never shows a hairline of the page along the seams.
const PANELS: { key: string; className: string; x: string; y: string }[] = [
	{ key: "tl", className: "top-0 left-0 [&>div]:top-0 [&>div]:left-0", x: "-100%", y: "-100%" },
	{ key: "tr", className: "top-0 right-0 [&>div]:top-0 [&>div]:right-0", x: "100%", y: "-100%" },
	{
		key: "bl",
		className: "bottom-0 left-0 [&>div]:bottom-0 [&>div]:left-0",
		x: "-100%",
		y: "100%",
	},
	{
		key: "br",
		className: "bottom-0 right-0 [&>div]:bottom-0 [&>div]:right-0",
		x: "100%",
		y: "100%",
	},
];

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}

// The hero photo is a `priority` next/image already in the DOM by the time this mounts, and the
// cover's own ghosted copies (`.opening-photo`) sit beside it, so every real element is awaited rather than
// a second fetch of the raw URL (which `next/image` never requests as-is).
function waitForHeroAssets(): Promise<void> {
	const fonts =
		"fonts" in document ? document.fonts.ready.then(() => undefined) : Promise.resolve();
	const images = Array.from(
		document.querySelectorAll<HTMLImageElement>(
			"img.hero-photo-img, img.opening-photo, img.opening-cinema-poster"
		)
	)
		.filter((image) => !image.complete)
		.map(
			(image) =>
				new Promise<void>((resolve) => {
					image.addEventListener("load", () => resolve(), { once: true });
					image.addEventListener("error", () => resolve(), { once: true });
				})
		);
	return Promise.all([fonts, ...images]).then(() => undefined);
}

/*
 * The first-load "closed invitation" cover (reference: thedigitalyes.com). It must never trap a
 * guest, so every escape hatch is real rather than cosmetic:
 * - `prefers-reduced-motion` skips it entirely (the effect below never arms `shouldShow`).
 * - It only mounts from a `useEffect`, so server HTML and a no-JS client never render it at all.
 * - `sessionStorage` remembers an opened cover so it doesn't reappear on the same visit
 *   (`forceShow`, set by the `?opening=` preview param, ignores that so every variant can be
 *   compared without clearing storage).
 * - Escape opens it in any phase, loading included, so a keyboard-only guest isn't stuck
 *   needing a pointer or waiting on a slow photo.
 */
export function InvitationOpening({
	coupleNames,
	theme,
	animation,
	heroImageUrl,
	holdSeconds,
	speed,
	forceShow = false,
	labels,
}: {
	coupleNames: string;
	theme: SiteTheme;
	animation: CoverAnimation;
	/** Ghosted behind the cover art and sharpened on open, so the reveal lands on the same photo. */
	heroImageUrl: string | null;
	/** Seconds the cover holds after assets load before the button appears (admin setting). */
	holdSeconds: number;
	/** Reveal speed as a percentage (admin setting); scales every open animation and delay. */
	speed: number;
	forceShow?: boolean;
	labels: { open: string; loading: string; skip: string };
}) {
	const [shouldShow, setShouldShow] = useState(false);
	const [phase, setPhase] = useState<Phase>("loading");
	const [isVisible, setIsVisible] = useState(true);
	const [isRevealing, setIsRevealing] = useState(false);
	const hasOpenedRef = useRef(false);
	const isFinishingRef = useRef(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const skipRef = useRef<HTMLButtonElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const timerRef = useRef<number | null>(null);
	const artRef = useRef<HTMLDivElement>(null);
	const isFilm = animation === OpeningAnimation.MEDITERRANEAN_BLOOM;
	// 200% speed → every reveal duration and delay is halved, in CSS (`--opening-scale`) and here.
	const scale = 100 / Math.max(speed, 1);

	const finishFilm = useCallback(() => {
		if (!hasOpenedRef.current || isFinishingRef.current) {
			return;
		}
		isFinishingRef.current = true;
		if (timerRef.current !== null) {
			window.clearTimeout(timerRef.current);
		}
		videoRef.current?.pause();
		setIsRevealing(true);
		timerRef.current = window.setTimeout(() => setIsVisible(false), 700);
	}, []);

	useEffect(
		() => () => {
			if (timerRef.current !== null) {
				window.clearTimeout(timerRef.current);
			}
		},
		[]
	);

	const handleOpen = useCallback(
		(skipFilm = false) => {
			if (hasOpenedRef.current) {
				if (isFilm && skipFilm) {
					finishFilm();
				}
				return;
			}
			hasOpenedRef.current = true;
			setPhase("opening");
			try {
				sessionStorage.setItem(SESSION_KEY, "1");
			} catch {
				// Private browsing or storage disabled: opening still proceeds, it just won't be
				// remembered as "already seen" for the rest of the session.
			}
			const art = (
				artRef.current?.querySelector("[data-opening-origin]") ??
				artRef.current?.querySelector("svg")
			)?.getBoundingClientRect();
			const detail: InvitationOpenedDetail = art
				? { x: art.left + art.width / 2, y: art.top + art.height / 2 }
				: undefined;
			window.dispatchEvent(
				new CustomEvent<InvitationOpenedDetail>(INVITATION_OPENED_EVENT, { detail })
			);
			if (isFilm) {
				const video = videoRef.current;
				if (skipFilm || !video || video.error) {
					finishFilm();
					return;
				}
				// Start inside the user's gesture; keep the poster until actual playback begins.
				video.playbackRate = 1 / scale;
				void video.play().catch(finishFilm);
				// A stalled network or decoder must not strand the guest behind the invitation.
				timerRef.current = window.setTimeout(finishFilm, revealMs[animation] * scale + 8000);
				return;
			}
			timerRef.current = window.setTimeout(() => setIsVisible(false), revealMs[animation] * scale);
		},
		[animation, scale, isFilm, finishFilm]
	);

	useEffect(() => {
		const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (prefersReducedMotion) {
			return;
		}
		if (!forceShow) {
			try {
				if (sessionStorage.getItem(SESSION_KEY)) {
					// Next tick, so listeners mounted later in the tree (Particles) are attached.
					window.setTimeout(
						() => window.dispatchEvent(new CustomEvent(INVITATION_OPENED_EVENT)),
						0
					);
					return;
				}
			} catch {
				// Storage disabled: still show the cover for this page view, see the comment above.
			}
		}
		setShouldShow(true);
	}, [forceShow]);

	useEffect(() => {
		if (!shouldShow) {
			return;
		}
		let isCancelled = false;
		const holdMs = holdSeconds * 1000;
		Promise.race([
			Promise.all([waitForHeroAssets(), wait(holdMs)]),
			wait(MAX_LOADING_MS + holdMs),
		]).then(() => {
			if (!isCancelled) {
				setPhase((current) => (current === "loading" ? "ready" : current));
			}
		});
		return () => {
			isCancelled = true;
		};
	}, [shouldShow, holdSeconds]);

	useEffect(() => {
		if (!shouldShow || (phase === "opening" && !isFilm)) {
			return;
		}
		if (phase === "ready") {
			buttonRef.current?.focus();
		} else if (phase === "opening") {
			skipRef.current?.focus();
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				handleOpen(true);
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [shouldShow, phase, handleOpen, isFilm]);

	if (!shouldShow || !isVisible || !coupleNames.trim()) {
		return null;
	}

	const initials = getInitials(coupleNames);
	const isSeal = animation === OpeningAnimation.SEAL;
	const isBloom = animation === OpeningAnimation.BLOOM;

	return (
		<div
			data-theme={dataTheme[theme]}
			data-opening={dataOpening[animation]}
			data-phase={phase}
			data-revealing={isRevealing ? "" : undefined}
			data-photo={heroImageUrl ? "" : undefined}
			role="dialog"
			aria-modal="true"
			aria-label={coupleNames}
			aria-busy={phase === "loading"}
			style={{ "--opening-scale": scale } as CSSProperties}
			className="opening-cover fixed inset-0 z-50 overflow-hidden text-ink"
		>
			{!isFilm &&
				PANELS.map((panel) => (
					<div
						key={panel.key}
						className={`opening-panel absolute h-[calc(50%+1px)] w-[calc(50%+1px)] overflow-hidden ${panel.className}`}
						style={{ "--panel-x": panel.x, "--panel-y": panel.y } as CSSProperties}
					>
						{/* Bottom to top: solid ground, the hero photo (blurred and dimmed at rest, full
					    on open), then the paper scrim carrying the theme's own page texture. */}
						<div className="absolute h-dvh w-screen bg-ivory">
							{heroImageUrl && (
								<Image
									src={heroImageUrl}
									alt=""
									fill
									sizes="100vw"
									className="opening-photo object-cover"
								/>
							)}
							<div className="opening-scrim absolute inset-0 bg-ivory/85" />
						</div>
					</div>
				))}
			<div
				ref={artRef}
				className="opening-content absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center"
			>
				{isFilm && (
					<MediterraneanArt
						videoRef={videoRef}
						initials={initials}
						coupleNames={coupleNames}
						openLabel={labels.open}
						ready={phase === "ready"}
						onOpen={() => handleOpen()}
						onFinished={finishFilm}
					/>
				)}
				{isSeal && (
					<SealArt
						initials={initials}
						coupleNames={coupleNames}
						openLabel={labels.open}
						ready={phase === "ready"}
						onOpen={() => handleOpen()}
					/>
				)}
				{animation === OpeningAnimation.MONOGRAM && <MonogramArt initials={initials} />}
				{isBloom ? (
					<div className="relative flex items-center justify-center">
						<BloomArt />
						<h2 className="opening-names absolute font-accent text-3xl text-ink sm:text-4xl">
							{coupleNames}
						</h2>
					</div>
				) : !isFilm ? (
					<h2 className="opening-names font-accent text-3xl text-ink sm:text-4xl">{coupleNames}</h2>
				) : null}
				{/* The loading label and the button share one grid cell so swapping them never
				    shifts the art above. */}
				<div className="opening-actions grid place-items-center [&>*]:col-start-1 [&>*]:row-start-1">
					<p className="opening-loading-label text-xs uppercase tracking-[0.3em] text-ink/60">
						{labels.loading}
						<span aria-hidden="true" className="opening-loading-dots">
							<span>.</span>
							<span>.</span>
							<span>.</span>
						</span>
					</p>
					<button
						ref={buttonRef}
						type="button"
						onClick={() => handleOpen()}
						tabIndex={phase === "ready" ? 0 : -1}
						aria-hidden={phase !== "ready"}
						className="opening-button min-h-11 rounded-full border border-ink/20 bg-ivory px-6 text-sm uppercase tracking-widest text-ink transition-colors outline-none hover:bg-ivory-dark focus-visible:border-ink/60 focus-visible:ring-2 focus-visible:ring-ink/20"
					>
						{labels.open}
					</button>
				</div>
				{isFilm && (
					<button
						ref={skipRef}
						type="button"
						onClick={() => handleOpen(true)}
						className="opening-cinema-skip"
					>
						{labels.skip}
					</button>
				)}
			</div>
		</div>
	);
}
