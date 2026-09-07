"use client";

import { useEffect, useRef } from "react";
import { INVITATION_OPENED_EVENT } from "@/components/site/invitation-opening";
import { SiteTheme } from "@/generated/prisma/enums";

/*
 * Ambient particle layer: one fixed, pointer-transparent canvas behind the nav and above the
 * page. Each theme gets its own kind of particle (petals, bokeh, stars, dust, confetti) drawn in
 * that theme's own tokens, read from the computed style of the canvas itself — it renders inside
 * `<main>`, which carries `data-theme`, so the CSS variables resolve without a second colour
 * table. It is a welcome, not a permanent weather system: the particles play for a few seconds
 * and fade out, starting on mount and again the moment a guest opens the invitation cover (so
 * the burst is seen after the cover, not wasted behind it). Reduced motion never starts the
 * loop, and a hidden tab pauses it.
 */

type Kind = "petal" | "bokeh" | "star" | "dust" | "confetti";

type Particle = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	rotation: number;
	spin: number;
	phase: number;
	alpha: number;
	color: string;
};

type ThemeParticles = { kind: Kind; tokens: string[]; density: number };

// `density` is particles per million CSS pixels of viewport, clamped below; `tokens` are the
// `--color-*` custom properties the particles are tinted with, picked at random per particle.
const themeParticles: Record<SiteTheme, ThemeParticles> = {
	[SiteTheme.EDITORIAL]: {
		kind: "bokeh",
		tokens: ["--color-green", "--color-green-dark"],
		density: 22,
	},
	[SiteTheme.MODERN]: { kind: "confetti", tokens: ["--color-green", "--color-ink"], density: 14 },
	[SiteTheme.GARDEN]: { kind: "petal", tokens: ["--color-green", "--color-rose"], density: 26 },
	[SiteTheme.MIDNIGHT]: { kind: "star", tokens: ["--color-green", "--color-ink"], density: 40 },
	[SiteTheme.BOHO]: { kind: "dust", tokens: ["--color-green", "--color-green-dark"], density: 26 },
	[SiteTheme.VINTAGE]: { kind: "petal", tokens: ["--color-rose", "--color-gold"], density: 26 },
};

const MIN_COUNT = 10;
const MAX_COUNT = 48;

// How long a burst stays at full strength, then how long it takes to fade to nothing.
const ACTIVE_MS = 6000;
const FADE_MS = 2500;

function hexToRgb(hex: string): [number, number, number] | null {
	const value = hex.trim().replace("#", "");
	const full =
		value.length === 3
			? value
					.split("")
					.map((char) => char + char)
					.join("")
			: value;
	if (!/^[0-9a-f]{6}$/i.test(full)) {
		return null;
	}
	const number = Number.parseInt(full, 16);
	return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
}

function resolveColors(element: HTMLElement, tokens: string[]): string[] {
	const style = getComputedStyle(element);
	const colors = tokens
		.map((token) => hexToRgb(style.getPropertyValue(token)))
		.filter((rgb): rgb is [number, number, number] => rgb !== null)
		.map(([r, g, b]) => `${r}, ${g}, ${b}`);
	return colors.length > 0 ? colors : ["128, 128, 128"];
}

function random(min: number, max: number): number {
	return min + Math.random() * (max - min);
}

function spawn(
	kind: Kind,
	width: number,
	height: number,
	colors: string[],
	atTop: boolean
): Particle {
	const color = colors[Math.floor(Math.random() * colors.length)];
	const base: Particle = {
		x: random(0, width),
		y: atTop ? -20 : random(0, height),
		vx: 0,
		vy: 0,
		size: 1,
		rotation: random(0, Math.PI * 2),
		spin: 0,
		phase: random(0, Math.PI * 2),
		alpha: 1,
		color,
	};
	switch (kind) {
		case "petal":
			return {
				...base,
				vx: random(-8, 8),
				vy: random(18, 36),
				size: random(5, 9),
				spin: random(-1, 1),
				alpha: random(0.5, 0.8),
			};
		case "bokeh":
			return {
				...base,
				y: atTop ? height + 20 : base.y,
				vx: random(-4, 4),
				vy: random(-14, -6),
				size: random(6, 18),
				alpha: random(0.08, 0.2),
			};
		case "star":
			return {
				...base,
				vx: random(-2, 2),
				vy: random(-3, 3),
				size: random(0.8, 2),
				alpha: random(0.4, 1),
			};
		case "dust":
			return {
				...base,
				vx: random(4, 14),
				vy: random(-4, 4),
				size: random(1.5, 3.5),
				alpha: random(0.25, 0.5),
			};
		case "confetti":
			return {
				...base,
				vx: random(-6, 6),
				vy: random(12, 24),
				size: random(3, 5),
				spin: random(-2, 2),
				alpha: random(0.35, 0.6),
			};
	}
}

function draw(context: CanvasRenderingContext2D, particle: Particle, kind: Kind, time: number) {
	context.save();
	context.translate(particle.x, particle.y);
	switch (kind) {
		case "petal": {
			context.rotate(particle.rotation);
			context.fillStyle = `rgba(${particle.color}, ${particle.alpha})`;
			context.beginPath();
			context.ellipse(0, 0, particle.size * 0.55, particle.size, 0, 0, Math.PI * 2);
			context.fill();
			break;
		}
		case "bokeh": {
			const gradient = context.createRadialGradient(0, 0, 0, 0, 0, particle.size);
			gradient.addColorStop(0, `rgba(${particle.color}, ${particle.alpha})`);
			gradient.addColorStop(1, `rgba(${particle.color}, 0)`);
			context.fillStyle = gradient;
			context.beginPath();
			context.arc(0, 0, particle.size, 0, Math.PI * 2);
			context.fill();
			break;
		}
		case "star": {
			const twinkle = 0.55 + 0.45 * Math.sin(time * 1.8 + particle.phase);
			context.fillStyle = `rgba(${particle.color}, ${particle.alpha * twinkle})`;
			context.beginPath();
			context.arc(0, 0, particle.size, 0, Math.PI * 2);
			context.fill();
			break;
		}
		case "dust": {
			context.fillStyle = `rgba(${particle.color}, ${particle.alpha})`;
			context.beginPath();
			context.arc(0, 0, particle.size, 0, Math.PI * 2);
			context.fill();
			break;
		}
		case "confetti": {
			context.rotate(particle.rotation);
			context.fillStyle = `rgba(${particle.color}, ${particle.alpha})`;
			context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
			break;
		}
	}
	context.restore();
}

export function Particles({ theme }: { theme: SiteTheme }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const wrapper = wrapperRef.current;
		if (!canvas || !wrapper || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return;
		}
		const context = canvas.getContext("2d");
		if (!context) {
			return;
		}

		const { kind, tokens, density } = themeParticles[theme];
		const colors = resolveColors(canvas, tokens);
		let width = 0;
		let height = 0;
		let particles: Particle[] = [];
		let frame: number | null = null;
		let lastTime = 0;
		let isActive = false;
		let fadeTimer: number | null = null;
		let stopTimer: number | null = null;

		function resize() {
			const ratio = Math.min(window.devicePixelRatio || 1, 2);
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = Math.floor(width * ratio);
			canvas.height = Math.floor(height * ratio);
			context.setTransform(ratio, 0, 0, ratio, 0, 0);
			const count = Math.round(
				Math.min(MAX_COUNT, Math.max(MIN_COUNT, (width * height * density) / 1_000_000))
			);
			particles = Array.from({ length: count }, () => spawn(kind, width, height, colors, false));
		}

		function tick(now: number) {
			const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
			lastTime = now;
			const time = now / 1000;
			context.clearRect(0, 0, width, height);
			for (let index = 0; index < particles.length; index += 1) {
				const particle = particles[index];
				const sway =
					kind === "petal" || kind === "confetti" ? Math.sin(time * 1.2 + particle.phase) * 14 : 0;
				particle.x += (particle.vx + sway) * delta;
				particle.y += particle.vy * delta;
				particle.rotation += particle.spin * delta;
				const isOut =
					particle.y > height + 24 ||
					particle.y < -24 ||
					particle.x > width + 24 ||
					particle.x < -24;
				if (isOut) {
					particles[index] = spawn(
						kind,
						width,
						height,
						colors,
						kind === "petal" || kind === "confetti" || kind === "bokeh"
					);
					if (kind === "dust") {
						particles[index].x = -10;
					}
					if (kind === "star") {
						particles[index].x = random(0, width);
						particles[index].y = random(0, height);
					}
				}
				draw(context, particles[index], kind, time);
			}
			frame = requestAnimationFrame(tick);
		}

		function startLoop() {
			if (frame === null) {
				lastTime = 0;
				frame = requestAnimationFrame(tick);
			}
		}

		function stopLoop() {
			if (frame !== null) {
				cancelAnimationFrame(frame);
				frame = null;
			}
		}

		function clearTimers() {
			if (fadeTimer !== null) {
				window.clearTimeout(fadeTimer);
				fadeTimer = null;
			}
			if (stopTimer !== null) {
				window.clearTimeout(stopTimer);
				stopTimer = null;
			}
		}

		// One burst: fresh particles at full opacity, a fade after `ACTIVE_MS`, and the loop
		// stopped once the fade has finished so an idle page costs nothing.
		function burst() {
			clearTimers();
			resize();
			wrapper.style.transitionDuration = "0ms";
			wrapper.style.opacity = "1";
			isActive = true;
			startLoop();
			fadeTimer = window.setTimeout(() => {
				wrapper.style.transitionDuration = `${FADE_MS}ms`;
				wrapper.style.opacity = "0";
			}, ACTIVE_MS);
			stopTimer = window.setTimeout(() => {
				isActive = false;
				stopLoop();
				context.clearRect(0, 0, width, height);
			}, ACTIVE_MS + FADE_MS);
		}

		function handleVisibility() {
			if (document.hidden) {
				stopLoop();
			} else if (isActive) {
				startLoop();
			}
		}

		burst();
		window.addEventListener("resize", resize);
		window.addEventListener(INVITATION_OPENED_EVENT, burst);
		document.addEventListener("visibilitychange", handleVisibility);
		return () => {
			clearTimers();
			stopLoop();
			window.removeEventListener("resize", resize);
			window.removeEventListener(INVITATION_OPENED_EVENT, burst);
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, [theme]);

	return (
		<div
			ref={wrapperRef}
			aria-hidden="true"
			className="pointer-events-none fixed inset-0 z-10 transition-opacity ease-out"
		>
			<canvas ref={canvasRef} className="h-full w-full" />
		</div>
	);
}
