import Image from "next/image";
import { Countdown } from "@/components/site/countdown";
import { type Locale, SiteTheme } from "@/generated/prisma/enums";
import type { Dictionary } from "@/i18n";
import { formatDate } from "@/lib/format";

type HeroProps = {
	coupleNames: string;
	heroImageUrl: string | null;
	tagline: string;
	firstEventStartsAt: Date | null;
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

// The five themes need genuinely different hero layouts (photo backdrop vs. split columns vs.
// an arched frame vs. a bottom-anchored dark overlay vs. a two-tone block-and-frame split), so
// this branches on `theme` rather than trying to fold everything into one shared markup tree.
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
	return <EditorialHero {...props} />;
}

function EditorialHero({
	coupleNames,
	heroImageUrl,
	tagline,
	firstEventStartsAt,
	locale,
	dictionary,
}: HeroProps) {
	return (
		<section
			id="top"
			className="relative flex min-h-dvh scroll-mt-[var(--wed-nav-height)] items-center justify-center overflow-hidden text-ivory"
		>
			{heroImageUrl ? (
				<>
					<Image src={heroImageUrl} alt="" fill priority sizes="100vw" className="object-cover" />
					<div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/40 to-ink/70" />
				</>
			) : (
				<div className="absolute inset-0 bg-gradient-to-br from-green via-green-dark to-ink" />
			)}
			<div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
				{/* clamp floor tightened from `text-5xl` (48px) so a ~30-character couple-names
				    string doesn't force multi-line wrapping into a cramped 360px viewport. */}
				<h1 className="font-accent text-[clamp(2rem,9vw,4.5rem)] font-medium">{coupleNames}</h1>
				{firstEventStartsAt && (
					<p className="text-lg tracking-wide text-ivory/90">
						{formatDate(firstEventStartsAt, locale)}
					</p>
				)}
				{tagline && <p className="max-w-xl text-balance text-ivory/80">{tagline}</p>}
				{firstEventStartsAt && (
					<Countdown
						targetDate={firstEventStartsAt.toISOString()}
						labels={countdownLabels(dictionary)}
					/>
				)}
			</div>
		</section>
	);
}

function ModernHero({
	coupleNames,
	heroImageUrl,
	tagline,
	firstEventStartsAt,
	locale,
	dictionary,
}: HeroProps) {
	return (
		<section id="top" className="scroll-mt-[var(--wed-nav-height)] px-6 py-20 sm:py-28">
			<div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
				<div className="flex flex-col gap-8">
					{/* Floor lowered from 3.5rem so a ~30-character couple-names string doesn't
					    overflow a 360px viewport. */}
					<h1 className="font-accent text-[clamp(2.25rem,9vw,9rem)] italic leading-[0.92]">
						{coupleNames}
					</h1>
					<div className="flex flex-wrap items-center gap-6 border-t border-ink/15 pt-6 text-xs uppercase tracking-[0.2em] text-ink/70">
						{firstEventStartsAt && <span>{formatDate(firstEventStartsAt, locale)}</span>}
						{firstEventStartsAt && (
							<Countdown
								targetDate={firstEventStartsAt.toISOString()}
								labels={countdownLabels(dictionary)}
							/>
						)}
					</div>
					{tagline && <p className="max-w-md text-ink/70">{tagline}</p>}
				</div>
				{/* `order-first`/`lg:order-none` puts the photo ahead of the text column on mobile
				    (a 4:5 crop) while falling back to normal DOM order — text left, photo right,
				    at the original 3:4 crop — from `lg:` up. */}
				<div className="relative order-first aspect-[4/5] w-full overflow-hidden bg-ivory-dark lg:order-none lg:aspect-[3/4]">
					{heroImageUrl && (
						<Image
							src={heroImageUrl}
							alt=""
							fill
							priority
							sizes="(min-width: 1024px) 50vw, 100vw"
							className="object-cover"
						/>
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
	firstEventStartsAt,
	locale,
	dictionary,
}: HeroProps) {
	return (
		<section
			id="top"
			className="flex scroll-mt-[var(--wed-nav-height)] flex-col items-center gap-8 px-6 py-24 text-center"
		>
			<h1 className="hero-couple-names text-green">{coupleNames}</h1>
			<div className="relative aspect-[3/4] w-full max-w-md overflow-hidden rounded-t-[999px] rounded-b-3xl bg-ivory-dark">
				{heroImageUrl && (
					<Image
						src={heroImageUrl}
						alt=""
						fill
						priority
						sizes="(min-width: 768px) 28rem, 100vw"
						className="object-cover"
					/>
				)}
			</div>
			{firstEventStartsAt && (
				<p className="text-lg tracking-wide text-ink/70">
					{formatDate(firstEventStartsAt, locale)}
				</p>
			)}
			{tagline && <p className="max-w-xl text-balance text-ink/70">{tagline}</p>}
			{firstEventStartsAt && (
				<Countdown
					targetDate={firstEventStartsAt.toISOString()}
					labels={countdownLabels(dictionary)}
					variant="pills"
				/>
			)}
		</section>
	);
}

function MidnightHero({
	coupleNames,
	heroImageUrl,
	tagline,
	firstEventStartsAt,
	locale,
	dictionary,
}: HeroProps) {
	return (
		<section
			id="top"
			className="relative flex min-h-dvh scroll-mt-[var(--wed-nav-height)] items-end overflow-hidden text-ivory"
		>
			{heroImageUrl ? (
				<>
					<Image src={heroImageUrl} alt="" fill priority sizes="100vw" className="object-cover" />
					<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
				</>
			) : (
				<div className="absolute inset-0 bg-gradient-to-b from-ink via-ink to-black" />
			)}
			<div className="relative z-10 flex w-full flex-col gap-8 px-6 pb-16 sm:px-12 sm:pb-20">
				<div className="flex flex-col items-start gap-3 text-left">
					{firstEventStartsAt && (
						<p className="text-xs uppercase tracking-[0.3em] text-ivory/70">
							{formatDate(firstEventStartsAt, locale)}
						</p>
					)}
					<h1 className="max-w-3xl text-[clamp(2.25rem,10vw,6rem)] font-light italic leading-[0.95]">
						{coupleNames}
					</h1>
					{tagline && <p className="max-w-md text-balance text-ivory/70">{tagline}</p>}
				</div>
				{firstEventStartsAt && (
					<div className="flex flex-wrap items-center gap-6 border-t border-green/30 pt-6 text-green">
						<span className="text-xs uppercase tracking-[0.25em]">
							{formatDate(firstEventStartsAt, locale)}
						</span>
						<Countdown
							targetDate={firstEventStartsAt.toISOString()}
							labels={countdownLabels(dictionary)}
						/>
					</div>
				)}
			</div>
		</section>
	);
}

function BohoHero({
	coupleNames,
	heroImageUrl,
	tagline,
	firstEventStartsAt,
	locale,
	dictionary,
}: HeroProps) {
	return (
		<section id="top" className="scroll-mt-[var(--wed-nav-height)] px-4 py-10 sm:px-6 sm:py-16">
			<div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-2 lg:items-stretch">
				{/* `text-ink` (not `text-ivory`) — the clay accent (`--color-green`) is too bright
				    for light sand text to clear 4.5:1, but dark ink against it does. */}
				<div className="flex flex-col justify-center gap-6 rounded-[2.5rem] bg-green px-8 py-12 text-ink sm:px-12">
					<h1 className="text-[clamp(2.25rem,9vw,6rem)] font-black leading-[0.95]">
						{coupleNames}
					</h1>
					{firstEventStartsAt && (
						<span className="inline-flex w-fit items-center rounded-full bg-ivory px-5 py-2 text-sm font-medium tracking-wide text-ink">
							{formatDate(firstEventStartsAt, locale)}
						</span>
					)}
					{tagline && <p className="max-w-md text-balance text-ink/85">{tagline}</p>}
					{firstEventStartsAt && (
						<Countdown
							targetDate={firstEventStartsAt.toISOString()}
							labels={countdownLabels(dictionary)}
							variant="pills"
						/>
					)}
				</div>
				{/* `order-first`/`lg:order-none` puts the photo ahead of the clay block on mobile
				    (a 4:5 crop); from `lg:` up it falls back to normal DOM order, i.e. second/right. */}
				<div className="order-first aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-ivory p-3 lg:order-none lg:aspect-auto lg:p-4">
					<div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-ivory-dark">
						{heroImageUrl && (
							<Image
								src={heroImageUrl}
								alt=""
								fill
								priority
								sizes="(min-width: 1024px) 50vw, 100vw"
								className="object-cover"
							/>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
