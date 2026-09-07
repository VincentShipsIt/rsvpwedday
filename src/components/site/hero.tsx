import Image from "next/image";
import type { CSSProperties } from "react";
import { Countdown } from "@/components/site/countdown";
import { HeroEntrance } from "@/components/site/hero-entrance";
import { LemonGlyph, LemonSprig } from "@/components/site/lemon-sprig";
import { Parallax } from "@/components/site/parallax";
import { type Locale, SiteTheme } from "@/generated/prisma/enums";
import type { Dictionary } from "@/i18n";
import { formatDate } from "@/lib/format";

type HeroProps = {
	coupleNames: string;
	heroImageUrl: string | null;
	tagline: string;
	countdownTarget: Date | null;
	locale: Locale;
	dictionary: Dictionary;
	theme: SiteTheme;
};

function countdownLabels(dictionary: Dictionary) {
	return {
		days: dictionary.site.countdownDays,
		hours: dictionary.site.countdownHours,
		minutes: dictionary.site.countdownMinutes,
		seconds: dictionary.site.countdownSeconds,
		today: dictionary.site.countdownToday,
	};
}

// `HeroEntrance` arms `.hero-entrance-item` children (globals.css) to fade-and-rise on load in
// 120ms steps; each item just needs its position in that sequence, set as the `--hero-delay`
// custom property the animation reads.
function heroDelayStyle(step: number): CSSProperties {
	return { "--hero-delay": `${step * 120}ms` } as CSSProperties;
}

// The seven themes need genuinely different hero layouts (photo backdrop vs. split columns vs.
// an arched frame vs. a bottom-anchored dark overlay vs. a two-tone block-and-frame split vs. a
// pressed-flower arched frame with a botanical rule vs. an arch flanked by lemon sprigs), so this branches on `theme` rather than trying to fold everything into
// one shared markup tree.
export function Hero(props: HeroProps) {
	if (props.theme === SiteTheme.MODERN) {
		return <ModernHero {...props} />;
	}
	if (props.theme === SiteTheme.GARDEN) {
		return <GardenHero {...props} />;
	}
	if (props.theme === SiteTheme.MIDNIGHT) {
		return <MidnightHero {...props} />;
	}
	if (props.theme === SiteTheme.BOHO) {
		return <BohoHero {...props} />;
	}
	if (props.theme === SiteTheme.VINTAGE) {
		return <VintageHero {...props} />;
	}
	if (props.theme === SiteTheme.MEDITERRANEAN) {
		return <MediterraneanHero {...props} />;
	}
	return <EditorialHero {...props} />;
}

function EditorialHero({
	coupleNames,
	heroImageUrl,
	tagline,
	countdownTarget,
	locale,
	dictionary,
}: HeroProps) {
	return (
		<section
			id="top"
			// A photo hero earns a full viewport. Without one there is nothing to fill it, so the
			// gradient stops at a height the content actually occupies instead of opening on a
			// screen of empty colour.
			className={`relative flex scroll-mt-[var(--wed-nav-height)] items-center justify-center overflow-hidden text-ivory ${
				heroImageUrl ? "min-h-dvh" : "min-h-[62svh] py-24"
			}`}
		>
			{heroImageUrl ? (
				<>
					<div className="absolute inset-0">
						<Parallax factor={0.25} className="h-full w-full">
							<Image
								src={heroImageUrl}
								alt=""
								fill
								priority
								sizes="100vw"
								className="hero-photo-img object-cover"
							/>
						</Parallax>
					</div>
					<div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/40 to-ink/70" />
				</>
			) : (
				<div className="absolute inset-0 bg-gradient-to-br from-green via-green-dark to-ink" />
			)}
			<HeroEntrance className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
				{/* clamp floor tightened from `text-5xl` (48px) so a ~30-character couple-names
				    string doesn't force multi-line wrapping into a cramped 360px viewport. */}
				<h1
					className="hero-entrance-item font-accent text-[clamp(2rem,9vw,4.5rem)] font-medium"
					style={heroDelayStyle(0)}
				>
					{coupleNames}
				</h1>
				{countdownTarget && (
					<p
						className="hero-entrance-item text-lg tracking-wide text-ivory/90"
						style={heroDelayStyle(1)}
					>
						{formatDate(countdownTarget, locale)}
					</p>
				)}
				{tagline && (
					<p
						className="hero-entrance-item max-w-xl text-balance text-ivory/80"
						style={heroDelayStyle(2)}
					>
						{tagline}
					</p>
				)}
				{countdownTarget && (
					<div className="hero-entrance-item" style={heroDelayStyle(3)}>
						<Countdown
							targetDate={countdownTarget.toISOString()}
							labels={countdownLabels(dictionary)}
						/>
					</div>
				)}
			</HeroEntrance>
		</section>
	);
}

function ModernHero({
	coupleNames,
	heroImageUrl,
	tagline,
	countdownTarget,
	locale,
	dictionary,
}: HeroProps) {
	return (
		<section id="top" className="scroll-mt-[var(--wed-nav-height)] px-6 py-20 sm:py-28">
			<div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
				<HeroEntrance className="flex flex-col gap-8">
					{/* Floor lowered from 3.5rem so a ~30-character couple-names string doesn't
					    overflow a 360px viewport. */}
					<h1
						className="hero-entrance-item font-accent text-[clamp(2.25rem,9vw,9rem)] italic leading-[0.92]"
						style={heroDelayStyle(0)}
					>
						{coupleNames}
					</h1>
					<div
						className="hero-entrance-item flex flex-wrap items-center gap-6 border-t border-ink/15 pt-6 text-xs uppercase tracking-[0.2em] text-ink/70"
						style={heroDelayStyle(1)}
					>
						{countdownTarget && <span>{formatDate(countdownTarget, locale)}</span>}
						{countdownTarget && (
							<Countdown
								targetDate={countdownTarget.toISOString()}
								labels={countdownLabels(dictionary)}
							/>
						)}
					</div>
					{tagline && (
						<p className="hero-entrance-item max-w-md text-ink/70" style={heroDelayStyle(2)}>
							{tagline}
						</p>
					)}
				</HeroEntrance>
				{/* `order-first`/`lg:order-none` puts the photo ahead of the text column on mobile
				    (a 4:5 crop) while falling back to normal DOM order — text left, photo right,
				    at the original 3:4 crop — from `lg:` up. */}
				<div className="relative order-first aspect-[4/5] w-full bg-ivory-dark lg:order-none lg:aspect-[3/4]">
					{heroImageUrl && (
						<Parallax factor={0.25} className="h-full w-full">
							<Image
								src={heroImageUrl}
								alt=""
								fill
								priority
								sizes="(min-width: 1024px) 50vw, 100vw"
								className="hero-photo-img object-cover"
							/>
						</Parallax>
					)}
				</div>
			</div>
		</section>
	);
}

function GardenHero({
	coupleNames,
	heroImageUrl,
	tagline,
	countdownTarget,
	locale,
	dictionary,
}: HeroProps) {
	return (
		<section
			id="top"
			className="flex scroll-mt-[var(--wed-nav-height)] flex-col items-center gap-8 px-6 py-24 text-center"
		>
			<h1 className="hero-couple-names text-green">{coupleNames}</h1>
			<div className="relative aspect-[3/4] w-full max-w-md rounded-t-[999px] rounded-b-3xl bg-ivory-dark">
				{heroImageUrl && (
					<Parallax factor={0.25} className="h-full w-full rounded-t-[999px] rounded-b-3xl">
						<Image
							src={heroImageUrl}
							alt=""
							fill
							priority
							sizes="(min-width: 768px) 28rem, 100vw"
							className="hero-photo-img object-cover"
						/>
					</Parallax>
				)}
			</div>
			<HeroEntrance className="flex flex-col items-center gap-4">
				{countdownTarget && (
					<p
						className="hero-entrance-item text-lg tracking-wide text-ink/70"
						style={heroDelayStyle(0)}
					>
						{formatDate(countdownTarget, locale)}
					</p>
				)}
				{tagline && (
					<p
						className="hero-entrance-item max-w-xl text-balance text-ink/70"
						style={heroDelayStyle(1)}
					>
						{tagline}
					</p>
				)}
				{countdownTarget && (
					<div className="hero-entrance-item" style={heroDelayStyle(2)}>
						<Countdown
							targetDate={countdownTarget.toISOString()}
							labels={countdownLabels(dictionary)}
							variant="pills"
						/>
					</div>
				)}
			</HeroEntrance>
		</section>
	);
}

function MidnightHero({
	coupleNames,
	heroImageUrl,
	tagline,
	countdownTarget,
	locale,
	dictionary,
}: HeroProps) {
	return (
		// `text-ink` on the section below, not `text-ivory`: MIDNIGHT is the one theme where the
		// ivory/ink tokens flip (ivory becomes the dark page background, ink becomes the light
		// foreground), so this section's photo-overlay text needs the token that's actually
		// light here. The no-photo fallback gradient below reads `ivory`/`ivory-dark` instead of
		// `ink` for the same reason: those are the tokens that are actually dark in MIDNIGHT.
		<section
			id="top"
			// Same reasoning as the editorial hero: full viewport only when a photo fills it.
			className={`relative flex scroll-mt-[var(--wed-nav-height)] items-end overflow-hidden text-ink ${
				heroImageUrl ? "min-h-dvh" : "min-h-[62svh] py-24"
			}`}
		>
			{heroImageUrl ? (
				<>
					<div className="absolute inset-0">
						<Parallax factor={0.25} className="h-full w-full">
							<Image
								src={heroImageUrl}
								alt=""
								fill
								priority
								sizes="100vw"
								className="hero-photo-img object-cover"
							/>
						</Parallax>
					</div>
					<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
				</>
			) : (
				<div className="absolute inset-0 bg-gradient-to-b from-ivory via-ivory-dark to-black" />
			)}
			<HeroEntrance className="relative z-10 flex w-full flex-col gap-8 px-6 pb-16 sm:px-12 sm:pb-20">
				<div className="flex flex-col items-start gap-3 text-left">
					{countdownTarget && (
						<p
							className="hero-entrance-item text-xs uppercase tracking-[0.3em] text-ink/70"
							style={heroDelayStyle(0)}
						>
							{formatDate(countdownTarget, locale)}
						</p>
					)}
					<h1
						className="hero-entrance-item max-w-3xl text-[clamp(2.25rem,10vw,6rem)] font-light italic leading-[0.95]"
						style={heroDelayStyle(1)}
					>
						{coupleNames}
					</h1>
					{tagline && (
						<p
							className="hero-entrance-item max-w-md text-balance text-ink/70"
							style={heroDelayStyle(2)}
						>
							{tagline}
						</p>
					)}
				</div>
				{countdownTarget && (
					<div
						className="hero-entrance-item flex flex-wrap items-center gap-6 border-t border-green/30 pt-6 text-green"
						style={heroDelayStyle(3)}
					>
						<span className="text-xs uppercase tracking-[0.25em]">
							{formatDate(countdownTarget, locale)}
						</span>
						<Countdown
							targetDate={countdownTarget.toISOString()}
							labels={countdownLabels(dictionary)}
						/>
					</div>
				)}
			</HeroEntrance>
		</section>
	);
}

function BohoHero({
	coupleNames,
	heroImageUrl,
	tagline,
	countdownTarget,
	locale,
	dictionary,
}: HeroProps) {
	return (
		<section id="top" className="scroll-mt-[var(--wed-nav-height)] px-4 py-10 sm:px-6 sm:py-16">
			<div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-2 lg:items-stretch">
				{/* `text-ink` (not `text-ivory`) — the clay accent (`--color-green`) is too bright
				    for light sand text to clear 4.5:1, but dark ink against it does. */}
				<HeroEntrance className="flex flex-col justify-center gap-6 rounded-[2.5rem] bg-green px-8 py-12 text-ink sm:px-12">
					<h1
						className="hero-entrance-item text-[clamp(2.25rem,9vw,6rem)] font-black leading-[0.95]"
						style={heroDelayStyle(0)}
					>
						{coupleNames}
					</h1>
					{countdownTarget && (
						<span
							className="hero-entrance-item inline-flex w-fit items-center rounded-full bg-ivory px-5 py-2 text-sm font-medium tracking-wide text-ink"
							style={heroDelayStyle(1)}
						>
							{formatDate(countdownTarget, locale)}
						</span>
					)}
					{tagline && (
						<p
							className="hero-entrance-item max-w-md text-balance text-ink/85"
							style={heroDelayStyle(2)}
						>
							{tagline}
						</p>
					)}
					{countdownTarget && (
						<div className="hero-entrance-item" style={heroDelayStyle(3)}>
							<Countdown
								targetDate={countdownTarget.toISOString()}
								labels={countdownLabels(dictionary)}
								variant="pills"
							/>
						</div>
					)}
				</HeroEntrance>
				{/* `order-first`/`lg:order-none` puts the photo ahead of the clay block on mobile
				    (a 4:5 crop); from `lg:` up it falls back to normal DOM order, i.e. second/right. */}
				<div className="order-first aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-ivory p-3 lg:order-none lg:aspect-auto lg:p-4">
					<div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-ivory-dark">
						{heroImageUrl && (
							<Parallax factor={0.25} className="h-full w-full">
								<Image
									src={heroImageUrl}
									alt=""
									fill
									priority
									sizes="(min-width: 1024px) 50vw, 100vw"
									className="hero-photo-img object-cover"
								/>
							</Parallax>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}

function VintageHero({
	coupleNames,
	heroImageUrl,
	tagline,
	countdownTarget,
	locale,
	dictionary,
}: HeroProps) {
	return (
		<section
			id="top"
			className="relative flex scroll-mt-[var(--wed-nav-height)] flex-col items-center gap-8 overflow-hidden px-6 py-24 text-center"
		>
			{/* Faint paper texture behind everything, built from layered radial gradients only —
			    no image asset. */}
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgb(224_200_140/0.35),transparent_55%),radial-gradient(circle_at_82%_78%,rgb(56_73_47/0.1),transparent_50%)]" />
			<h1 className="hero-couple-names relative text-green-dark">{coupleNames}</h1>
			{/* Thin botanical rule: two hairlines flanking a small leaf glyph. */}
			<svg
				aria-hidden="true"
				viewBox="0 0 200 16"
				className="relative h-4 w-40 text-green"
				fill="none"
				stroke="currentColor"
				strokeWidth="1"
			>
				<path d="M0 8h76" strokeLinecap="round" />
				<path d="M124 8h76" strokeLinecap="round" />
				<path
					d="M100 8c-4-6-12-6-16 0 4 6 12 6 16 0Zm0 0c4-6 12-6 16 0-4 6-12 6-16 0Z"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
			<div className="relative aspect-[3/4] w-full max-w-md">
				<div className="absolute -inset-3 rounded-t-[999px] rounded-b-3xl bg-[radial-gradient(circle_at_30%_22%,rgb(224_200_140/0.45),transparent_60%),radial-gradient(circle_at_74%_76%,rgb(138_154_114/0.3),transparent_55%)]" />
				<div className="relative h-full w-full overflow-hidden rounded-t-[999px] rounded-b-3xl bg-ivory-dark ring-1 ring-ink/10">
					{heroImageUrl && (
						<Parallax factor={0.25} className="h-full w-full rounded-t-[999px] rounded-b-3xl">
							<Image
								src={heroImageUrl}
								alt=""
								fill
								priority
								sizes="(min-width: 768px) 28rem, 100vw"
								className="hero-photo-img object-cover"
							/>
						</Parallax>
					)}
				</div>
			</div>
			<HeroEntrance className="flex flex-col items-center gap-4">
				{countdownTarget && (
					<p
						className="hero-entrance-item text-lg tracking-wide text-ink/70"
						style={heroDelayStyle(0)}
					>
						{formatDate(countdownTarget, locale)}
					</p>
				)}
				{tagline && (
					<p
						className="hero-entrance-item max-w-xl text-balance text-ink/70"
						style={heroDelayStyle(1)}
					>
						{tagline}
					</p>
				)}
				{countdownTarget && (
					<div className="hero-entrance-item" style={heroDelayStyle(2)}>
						<Countdown
							targetDate={countdownTarget.toISOString()}
							labels={countdownLabels(dictionary)}
							variant="pills"
						/>
					</div>
				)}
			</HeroEntrance>
		</section>
	);
}

function MediterraneanHero({
	coupleNames,
	heroImageUrl,
	tagline,
	countdownTarget,
	locale,
	dictionary,
}: HeroProps) {
	return (
		<section
			id="top"
			// Garden's arched photo frame on the plain cream ground, a lemon sprig either
			// side of the arch from `sm:` up (they'd crowd the photo on a phone). Generous bottom
			// padding so the hero and the story beneath it breathe rather than abut.
			className="relative flex scroll-mt-[var(--wed-nav-height)] flex-col items-center overflow-hidden pb-16 text-center sm:pb-24"
		>
			<HeroEntrance className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-5 px-6 pt-20 text-center">
				{countdownTarget && (
					<p
						className="hero-entrance-item text-xs uppercase tracking-[0.35em] text-green"
						style={heroDelayStyle(0)}
					>
						{formatDate(countdownTarget, locale)}
					</p>
				)}
				<h1
					className="hero-entrance-item text-balance text-[clamp(2rem,7vw,5rem)] font-medium uppercase leading-[1.05] tracking-[0.12em]"
					style={heroDelayStyle(1)}
				>
					{coupleNames}
				</h1>
				<div
					className="hero-entrance-item flex items-center gap-3 text-gold"
					style={heroDelayStyle(2)}
				>
					<span className="h-px w-12 bg-current opacity-70" />
					<LemonGlyph className="h-6 w-8" />
					<span className="h-px w-12 bg-current opacity-70" />
				</div>
			</HeroEntrance>
			<div className="relative z-10 mt-10 w-full max-w-3xl px-6">
				{/* The sprigs hang off the arch's lower corners, stems tucked over the photo and the
				    lemons pointing outward, so they read as tucked into the frame rather than floating beside it. They sit in the arch's
				    own `max-w-md` box (not the wider column) so they stay put at every width. */}
				<div className="relative mx-auto w-full max-w-md">
					<LemonSprig className="pointer-events-none absolute bottom-6 -left-10 z-10 hidden w-36 -scale-x-100 rotate-12 drop-shadow-sm sm:block lg:-left-14 lg:w-44" />
					<LemonSprig className="pointer-events-none absolute -right-10 bottom-6 z-10 hidden w-36 -rotate-12 drop-shadow-sm sm:block lg:-right-14 lg:w-44" />
					{/* Garden's bare arch on the plain cream ground, with only a blue hairline. */}
					<div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-[999px] rounded-b-3xl bg-ivory-dark ring-1 ring-green/20">
						{heroImageUrl && (
							<Parallax factor={0.25} className="h-full w-full rounded-t-[999px] rounded-b-3xl">
								<Image
									src={heroImageUrl}
									alt=""
									fill
									priority
									sizes="(min-width: 768px) 28rem, 100vw"
									className="hero-photo-img object-cover"
								/>
							</Parallax>
						)}
					</div>
				</div>
			</div>
			<HeroEntrance className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-6 px-6 pt-10 pb-16 text-center">
				{tagline && (
					<p
						className="hero-entrance-item font-display max-w-2xl text-balance text-[clamp(1.375rem,2.6vw,1.875rem)] leading-snug text-green italic"
						style={heroDelayStyle(3)}
					>
						{tagline}
					</p>
				)}
				{countdownTarget && (
					<div className="hero-entrance-item" style={heroDelayStyle(4)}>
						<Countdown
							targetDate={countdownTarget.toISOString()}
							labels={countdownLabels(dictionary)}
							variant="pills"
						/>
					</div>
				)}
			</HeroEntrance>
		</section>
	);
}
