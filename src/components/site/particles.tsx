"use client";

import { useEffect, useRef } from "react";
import {
	INVITATION_OPENED_EVENT,
	type InvitationOpenedDetail,
} from "@/components/site/invitation-opening";
import { SiteTheme } from "@/generated/prisma/enums";

/*
 * Ambient particle layer: one fixed, pointer-transparent canvas above the page (and above the
 * invitation cover, so a burst can fly out over the cover as it opens). Each theme gets its own
 * kind of particle (petals, bokeh, stars, dust, confetti) drawn in that theme's own tokens, read
 * from the computed style of the canvas itself — it renders inside `<main>`, which carries
 * `data-theme`, so the CSS variables resolve without a second colour table.
 *
 * It is a welcome, not a permanent weather system: a burst plays for `seconds` and fades out.
 * With a cover on the page the burst waits for `INVITATION_OPENED_EVENT` and erupts from the
 * cover art's centre (the event carries that point), then settles into the kind's natural
 * drift; without a cover it starts on mount, scattered across the viewport. Reduced motion
 * never starts the loop, and a hidden tab pauses it.
 */

type Kind = "petal" | "bokeh" | "star" | "dust" | "confetti";

type Particle = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	driftX: number;
	driftY: number;
	size: number;
	rotation: number;
	spin: number;
	phase: number;
	alpha: number;
	color: string;
};

type ThemeParticles = { kind: Kind; tokens: string[] };

// `tokens` are the `--color-*` custom properties the particles are tinted with, picked at random
// per particle.
const themeParticles: Record<SiteTheme, ThemeParticles> = {
	[SiteTheme.EDITORIAL]: { kind: "bokeh", tokens: ["--color-green", "--color-green-dark"] },
	[SiteTheme.MODERN]: { kind: "confetti", tokens: ["--color-green", "--color-ink"] },
	[SiteTheme.GARDEN]: { kind: "petal", tokens: ["--color-green", "--color-rose"] },
	[SiteTheme.MIDNIGHT]: { kind: "star", tokens: ["--color-green", "--color-ink"] },
	[SiteTheme.BOHO]: { kind: "dust", tokens: ["--color-green", "--color-green-dark"] },
	[SiteTheme.VINTAGE]: { kind: "petal", tokens: ["--color-rose", "--color-gold"] },
	[SiteTheme.MEDITERRANEAN]: { kind: "petal", tokens: ["--color-gold", "--color-green-dark"] },
};

const FADE_MS = 2500;

// Radial burst from the cover: initial speed range (px/s) and how quickly that decays into the
// kind's natural drift (fraction of the remaining difference per second).
const BURST_MIN_SPEED = 160;
const BURST_MAX_SPEED = 420;
const BURST_DAMPING = 2.2;

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

type SpawnOptions = {
	kind: Kind;
	width: number;
	height: number;
	colors: string[];
	speed: number;
	/** Where to appear: scattered, just outside the edge it drifts in from, or at a point. */
	placement: "anywhere" | "edge" | { x: number; y: number };
};

function spawn({ kind, width, height, colors, speed, placement }: SpawnOptions): Particle {
	const color = colors[Math.floor(Math.random() * colors.length)];
	const base = {
		x: random(0, width),
		y: random(0, height),
		rotation: random(0, Math.PI * 2),
		spin: 0,
		phase: random(0, Math.PI * 2),
		color,
	};

	let particle: Particle;
	switch (kind) {
		case "petal":
			particle = {
				...base,
				driftX: random(-8, 8) * speed,
				driftY: random(18, 36) * speed,
				size: random(5, 9),
				spin: random(-1, 1),
				alpha: random(0.5, 0.8),
				vx: 0,
				vy: 0,
			};
			if (placement === "edge") {
				particle.y = -20;
			}
			break;
		case "bokeh":
			particle = {
				...base,
				driftX: random(-4, 4) * speed,
				driftY: random(-14, -6) * speed,
				size: random(6, 18),
				alpha: random(0.08, 0.2),
				vx: 0,
				vy: 0,
			};
			if (placement === "edge") {
				particle.y = height + 20;
			}
			break;
		case "star":
			particle = {
				...base,
				driftX: random(-2, 2) * speed,
				driftY: random(-3, 3) * speed,
				size: random(0.8, 2),
				alpha: random(0.4, 1),
				vx: 0,
				vy: 0,
			};
			break;
		case "dust":
			particle = {
				...base,
				driftX: random(4, 14) * speed,
				driftY: random(-4, 4) * speed,
				size: random(1.5, 3.5),
				alpha: random(0.25, 0.5),
				vx: 0,
				vy: 0,
			};
			if (placement === "edge") {
				particle.x = -10;
			}
			break;
		case "confetti":
			particle = {
				...base,
				driftX: random(-6, 6) * speed,
				driftY: random(12, 24) * speed,
				size: random(3, 5),
				spin: random(-2, 2),
				alpha: random(0.35, 0.6),
				vx: 0,
				vy: 0,
			};
			if (placement === "edge") {
				particle.y = -20;
			}
			break;
	}

	if (typeof placement === "object") {
		const angle = random(0, Math.PI * 2);
		const burstSpeed = random(BURST_MIN_SPEED, BURST_MAX_SPEED) * speed;
		particle.x = placement.x;
		particle.y = placement.y;
		particle.vx = Math.cos(angle) * burstSpeed;
		particle.vy = Math.sin(angle) * burstSpeed;
	} else {
		particle.vx = particle.driftX;
		particle.vy = particle.driftY;
	}
	return particle;
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

export type ParticlesProps = {
	theme: SiteTheme;
	/** Particles per burst; a phone-sized viewport gets proportionally fewer. */
	count: number;
	/** Seconds at full strength before the fade; 0 never fades. */
	seconds: number;
	/** Drift speed as a percentage. */
	speed: number;
	/** True when an invitation cover is on the page: the first burst then waits for it to open. */
	startsOnOpen: boolean;
};

export function Particles({ theme, count, seconds, speed, startsOnOpen }: ParticlesProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const canvasNode = canvasRef.current;
		const wrapperNode = wrapperRef.current;
		if (
			!canvasNode ||
			!wrapperNode ||
			count <= 0 ||
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		) {
			return;
		}
		const context2d = canvasNode.getContext("2d");
		if (!context2d) {
			return;
		}
		// Re-bound as non-null consts: the hoisted function declarations below don't inherit the
		// narrowing from the guards above.
		const canvas: HTMLCanvasElement = canvasNode;
		const wrapper: HTMLDivElement = wrapperNode;
		const context: CanvasRenderingContext2D = context2d;

		const { kind, tokens } = themeParticles[theme];
		const colors = resolveColors(canvas, tokens);
		const speedFactor = speed / 100;
		let width = 0;
		let height = 0;
		let particles: Particle[] = [];
		let frame: number | null = null;
		let lastTime = 0;
		let isActive = false;
		let fadeTimer: number | null = null;
		let stopTimer: number | null = null;

		function targetCount(): number {
			// Full count from about a laptop viewport up; a phone gets proportionally fewer.
			return Math.round(count * Math.min(1, (width * height) / 900_000));
		}

		function resize() {
			const ratio = Math.min(window.devicePixelRatio || 1, 2);
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = Math.floor(width * ratio);
			canvas.height = Math.floor(height * ratio);
			context.setTransform(ratio, 0, 0, ratio, 0, 0);
		}

		function populate(placement: SpawnOptions["placement"]) {
			particles = Array.from({ length: targetCount() }, () =>
				spawn({ kind, width, height, colors, speed: speedFactor, placement })
			);
		}

		function tick(now: number) {
			const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
			lastTime = now;
			const time = now / 1000;
			const settle = Math.min(1, BURST_DAMPING * delta);
			context.clearRect(0, 0, width, height);
			for (let index = 0; index < particles.length; index += 1) {
				const particle = particles[index];
				// Whatever burst velocity a particle started with decays into its natural drift.
				particle.vx += (particle.driftX - particle.vx) * settle;
				particle.vy += (particle.driftY - particle.vy) * settle;
				const sway =
					kind === "petal" || kind === "confetti"
						? Math.sin(time * 1.2 + particle.phase) * 14 * speedFactor
						: 0;
				particle.x += (particle.vx + sway) * delta;
				particle.y += particle.vy * delta;
				particle.rotation += particle.spin * delta;
				const isOut =
					particle.y > height + 24 ||
					particle.y < -24 ||
					particle.x > width + 24 ||
					particle.x < -24;
				if (isOut) {
					particles[index] = spawn({
						kind,
						width,
						height,
						colors,
						speed: speedFactor,
						placement: kind === "star" ? "anywhere" : "edge",
					});
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

		// One burst: fresh particles at full opacity, a fade after `seconds`, and the loop stopped
		// once the fade has finished so an idle page costs nothing.
		function burst(placement: SpawnOptions["placement"]) {
			clearTimers();
			resize();
			populate(placement);
			wrapper.style.transitionDuration = "0ms";
			wrapper.style.opacity = "1";
			isActive = true;
			startLoop();
			if (seconds <= 0) {
				return;
			}
			fadeTimer = window.setTimeout(() => {
				wrapper.style.transitionDuration = `${FADE_MS}ms`;
				wrapper.style.opacity = "0";
			}, seconds * 1000);
			stopTimer = window.setTimeout(
				() => {
					isActive = false;
					stopLoop();
					context.clearRect(0, 0, width, height);
				},
				seconds * 1000 + FADE_MS
			);
		}

		function handleOpened(event: Event) {
			const detail = (event as CustomEvent<InvitationOpenedDetail>).detail;
			burst(detail ? { x: detail.x, y: detail.y } : "anywhere");
		}

		function handleVisibility() {
			if (document.hidden) {
				stopLoop();
			} else if (isActive) {
				startLoop();
			}
		}

		if (!startsOnOpen) {
			burst("anywhere");
		}
		window.addEventListener("resize", resize);
		window.addEventListener(INVITATION_OPENED_EVENT, handleOpened);
		document.addEventListener("visibilitychange", handleVisibility);
		return () => {
			clearTimers();
			stopLoop();
			window.removeEventListener("resize", resize);
			window.removeEventListener(INVITATION_OPENED_EVENT, handleOpened);
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, [theme, count, seconds, speed, startsOnOpen]);

	return (
		<div
			ref={wrapperRef}
			aria-hidden="true"
			className="pointer-events-none fixed inset-0 z-[60] transition-opacity ease-out"
		>
			<canvas ref={canvasRef} className="h-full w-full" />
		</div>
	);
}
