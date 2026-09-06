import Image from "next/image";
import { Countdown } from "@/components/site/countdown";
import type { Locale } from "@/generated/prisma/enums";
import type { Dictionary } from "@/i18n";
import { formatDate } from "@/lib/format";

export function Hero({
	coupleNames,
	heroImageUrl,
	tagline,
	firstEventStartsAt,
	locale,
	dictionary,
}: {
	coupleNames: string;
	heroImageUrl: string | null;
	tagline: string;
	firstEventStartsAt: Date | null;
	locale: Locale;
	dictionary: Dictionary;
}) {
	return (
		<section
			id="top"
			className="relative flex min-h-dvh items-center justify-center overflow-hidden text-ivory"
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
				<h1 className="text-5xl font-medium sm:text-7xl">{coupleNames}</h1>
				{firstEventStartsAt && (
					<p className="text-lg tracking-wide text-ivory/90">
						{formatDate(firstEventStartsAt, locale)}
					</p>
				)}
				{tagline && <p className="max-w-xl text-balance text-ivory/80">{tagline}</p>}
				{firstEventStartsAt && (
					<Countdown
						targetDate={firstEventStartsAt.toISOString()}
						labels={{
							days: dictionary.site.countdownDays,
							hours: dictionary.site.countdownHours,
							minutes: dictionary.site.countdownMinutes,
							seconds: dictionary.site.countdownSeconds,
							today: dictionary.site.countdownToday,
						}}
					/>
				)}
			</div>
		</section>
	);
}
