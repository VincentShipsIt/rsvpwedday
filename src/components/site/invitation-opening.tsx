"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { BloomArt } from "@/components/site/opening/bloom-art";
import { getInitials } from "@/components/site/opening/initials";
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
// longest animation/delay chain in that variant's `[data-phase="opening"]` CSS.
const revealMs: Record<CoverAnimation, number> = {
	[OpeningAnimation.SEAL]: 1800,
	[OpeningAnimation.MONOGRAM]: 1300,
	[OpeningAnimation.BLOOM]: 1600,
};

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}

// The hero photo is a `priority` next/image already in the DOM by the time this mounts, so the
// real element is awaited rather than a second fetch of the raw URL (which `next/image` never
// requests as-is).
function waitForHeroAssets(): Promise<void> {
	const fonts =
		"fonts" in document ? document.fonts.ready.then(() => undefined) : Promise.resolve();
	const heroImage = document.querySelector<HTMLImageElement>("img.hero-photo-img");
	const image =
		heroImage && !heroImage.complete
			? new Promise<void>((resolve) => {
					heroImage.addEventListener("load", () => resolve(), { once: true });
					heroImage.addEventListener("error", () => resolve(), { once: true });
				})
			: Promise.resolve();
	return Promise.all([fonts, image]).then(() => undefined);
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
	holdSeconds,
	speed,
	forceShow = false,
	labels,
}: {
	coupleNames: string;
	theme: SiteTheme;
	animation: CoverAnimation;
	/** Seconds the cover holds after assets load before the button appears (admin setting). */
	holdSeconds: number;
	/** Reveal speed as a percentage (admin setting); scales every open animation and delay. */
	speed: number;
	forceShow?: boolean;
	labels: { open: string; loading: string };
}) {
	const [shouldShow, setShouldShow] = useState(false);
	const [phase, setPhase] = useState<Phase>("loading");
	const [isVisible, setIsVisible] = useState(true);
	const hasOpenedRef = useRef(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const artRef = useRef<HTMLDivElement>(null);
	// 200% speed → every reveal duration and delay is halved, in CSS (`--opening-scale`) and here.
	const scale = 100 / Math.max(speed, 1);

	const handleOpen = useCallback(() => {
		if (hasOpenedRef.current) {
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
		const art = artRef.current?.querySelector("svg")?.getBoundingClientRect();
		const detail: InvitationOpenedDetail = art
			? { x: art.left + art.width / 2, y: art.top + art.height / 2 }
			: undefined;
		window.dispatchEvent(
			new CustomEvent<InvitationOpenedDetail>(INVITATION_OPENED_EVENT, { detail })
		);
		window.setTimeout(() => setIsVisible(false), revealMs[animation] * scale);
	}, [animation, scale]);

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
		if (!shouldShow || phase === "opening") {
			return;
		}
		if (phase === "ready") {
			buttonRef.current?.focus();
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				handleOpen();
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [shouldShow, phase, handleOpen]);

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
			role="dialog"
			aria-modal="true"
			aria-label={coupleNames}
			aria-busy={phase === "loading"}
			style={{ "--opening-scale": scale } as CSSProperties}
			className="opening-cover fixed inset-0 z-50 overflow-hidden text-ink"
		>
			{isSeal ? (
				<>
					{/* Two solid, full-height "doors"; each carries its own faint paper texture on top of
					    a solid fill so the page behind is fully hidden at rest and genuinely revealed,
					    not just masked by a shared backdrop, once they slide apart. */}
					<div className="opening-door opening-door-left absolute inset-y-0 left-0 w-1/2 border-r border-ink/10 bg-ivory bg-[radial-gradient(circle_at_80%_30%,rgb(224_200_140/0.35),transparent_55%)]" />
					<div className="opening-door opening-door-right absolute inset-y-0 right-0 w-1/2 bg-ivory bg-[radial-gradient(circle_at_20%_70%,rgb(224_200_140/0.35),transparent_55%)]" />
				</>
			) : (
				<div className="absolute inset-0 bg-ivory bg-[radial-gradient(circle_at_50%_40%,transparent_40%,rgb(0_0_0/0.06)_100%)]" />
			)}
			<div
				ref={artRef}
				className="opening-content absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center"
			>
				{isSeal && <SealArt initials={initials} />}
				{animation === OpeningAnimation.MONOGRAM && <MonogramArt initials={initials} />}
				{isBloom ? (
					<div className="relative flex items-center justify-center">
						<BloomArt />
						<h2 className="opening-names absolute font-accent text-3xl text-ink sm:text-4xl">
							{coupleNames}
						</h2>
					</div>
				) : (
					<h2 className="opening-names font-accent text-3xl text-ink sm:text-4xl">{coupleNames}</h2>
				)}
				{/* The loading label and the button share one grid cell so swapping them never
				    shifts the art above. */}
				<div className="grid place-items-center [&>*]:col-start-1 [&>*]:row-start-1">
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
						onClick={handleOpen}
						tabIndex={phase === "ready" ? 0 : -1}
						aria-hidden={phase !== "ready"}
						className="opening-button min-h-11 rounded-full border border-ink/20 bg-ivory px-6 text-sm uppercase tracking-widest text-ink transition-colors outline-none hover:bg-ivory-dark focus-visible:border-ink/60 focus-visible:ring-2 focus-visible:ring-ink/20"
					>
						{labels.open}
					</button>
				</div>
			</div>
		</div>
	);
}
