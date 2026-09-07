"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { INVITATION_OPENED_EVENT } from "@/components/site/invitation-opening";
import type { SiteTheme } from "@/generated/prisma/enums";
import { dataTheme } from "@/lib/site-theme";

const SESSION_KEY = "wed-music";
const TARGET_VOLUME = 0.65;
const FADE_MS = 1500;

/*
 * Background music with a floating on/off button. Browsers block autoplay until the page has a
 * user gesture, so the track only ever starts from one of two clicks: the guest opening the
 * invitation cover (`INVITATION_OPENED_EVENT`, dispatched inside that click) or this button.
 * A guest who switches it off is remembered for the session, and it is never started against
 * that choice. The element is `preload="none"` so a guest who never plays it never downloads it.
 */
export function MusicToggle({
	src,
	theme,
	labels,
}: {
	src: string;
	theme: SiteTheme;
	labels: { play: string; pause: string };
}) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const fadeFrameRef = useRef<number | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);

	function remember(value: "on" | "off") {
		try {
			sessionStorage.setItem(SESSION_KEY, value);
		} catch {
			// Storage disabled: the choice just doesn't survive a reload.
		}
	}

	// Stable (refs and setState only) so the mount effect below can list it as a dependency
	// without re-subscribing on every render.
	const play = useCallback(async () => {
		const audio = audioRef.current;
		if (!audio) {
			return;
		}
		try {
			await audio.play();
		} catch {
			// Autoplay refused (no gesture yet) or the file failed to load: stay silent, the
			// button still offers to start it.
			setIsPlaying(false);
			return;
		}
		setIsPlaying(true);
		if (fadeFrameRef.current) {
			cancelAnimationFrame(fadeFrameRef.current);
		}
		const startedAt = performance.now();
		audio.volume = 0;
		function step(now: number) {
			const progress = Math.min((now - startedAt) / FADE_MS, 1);
			audio.volume = progress * TARGET_VOLUME;
			if (progress < 1) {
				fadeFrameRef.current = requestAnimationFrame(step);
			}
		}
		fadeFrameRef.current = requestAnimationFrame(step);
	}, []);

	function pause() {
		const audio = audioRef.current;
		if (fadeFrameRef.current) {
			cancelAnimationFrame(fadeFrameRef.current);
		}
		audio?.pause();
		setIsPlaying(false);
	}

	useEffect(() => {
		let remembered: string | null = null;
		try {
			remembered = sessionStorage.getItem(SESSION_KEY);
		} catch {
			// Storage disabled: treat as no preference.
		}

		function handleOpened() {
			if (remembered !== "off") {
				play();
			}
		}

		window.addEventListener(INVITATION_OPENED_EVENT, handleOpened);
		// A guest who already had it on (earlier page in this session, or a same-session reload)
		// gets it back only if the browser still allows it; the failure path is silent.
		if (remembered === "on") {
			play();
		}
		return () => {
			window.removeEventListener(INVITATION_OPENED_EVENT, handleOpened);
			if (fadeFrameRef.current) {
				cancelAnimationFrame(fadeFrameRef.current);
			}
		};
	}, [play]);

	function handleToggle() {
		if (isPlaying) {
			pause();
			remember("off");
		} else {
			remember("on");
			play();
		}
	}

	return (
		<div data-theme={dataTheme[theme]} className="fixed bottom-4 right-4 z-30 text-ink">
			{/* biome-ignore lint/a11y/useMediaCaption: instrumental background music, not spoken content. */}
			<audio ref={audioRef} src={src} loop preload="none" />
			<button
				type="button"
				onClick={handleToggle}
				aria-pressed={isPlaying}
				aria-label={isPlaying ? labels.pause : labels.play}
				title={isPlaying ? labels.pause : labels.play}
				className={`music-toggle flex size-11 items-center justify-center rounded-full border border-ink/20 bg-ivory/85 shadow-md backdrop-blur transition-colors hover:bg-ivory-dark ${
					isPlaying ? "is-playing" : ""
				}`}
			>
				<svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor">
					<path d="M9 3v12.26A3.5 3.5 0 1 0 11 18.5V7h6V3H9Z" />
				</svg>
				<span aria-hidden="true" className="music-toggle-bars">
					<span />
					<span />
					<span />
				</span>
			</button>
		</div>
	);
}
