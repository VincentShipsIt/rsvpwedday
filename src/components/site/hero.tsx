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

// The three themes need genuinely different hero layouts (photo backdrop vs. split columns vs.
// an arched frame), so this branches on `theme` rather than trying to fold everything into one
// shared markup tree.
export function Hero(props: HeroProps) {
	if (props.theme === SiteTheme.MODERN) {
		return <ModernHero {...props} />;
	}
	if (props.theme === SiteTheme.GARDEN) {
		return <GardenHero {...props} />;
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
				<h1 className="font-accent text-5xl font-medium sm:text-7xl">{coupleNames}</h1>
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
					<h1 className="font-accent text-[clamp(3.5rem,9vw,9rem)] italic leading-[0.92]">
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
				<div className="relative aspect-[3/4] w-full overflow-hidden bg-ivory-dark">
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
