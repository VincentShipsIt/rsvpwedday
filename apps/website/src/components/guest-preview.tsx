import Image from "next/image";

export function GuestPreview() {
	return (
		<div className="relative mx-auto w-full max-w-xl">
			<div className="overflow-hidden rounded-2xl bg-paper text-ink shadow-[0_24px_80px_rgb(0_0_0/0.45)] ring-1 ring-paper/20">
				<div className="flex items-center gap-2 border-b border-ink/10 bg-sand px-4 py-2.5">
					<span className="size-2.5 rounded-full bg-ink/20" />
					<span className="size-2.5 rounded-full bg-ink/20" />
					<span className="size-2.5 rounded-full bg-ink/20" />
					<p className="ml-2 font-display text-[11px] tracking-wide text-ink-soft">
						elisajonas.com
					</p>
				</div>
				<div className="relative h-36 overflow-hidden">
					<Image
						src="/studio/cliff.jpg"
						alt=""
						fill
						sizes="(min-width: 1024px) 40vw, 90vw"
						className="object-cover"
					/>
					<div className="absolute inset-0 bg-ink/35" />
					<p className="absolute bottom-3 left-4 font-display text-2xl text-paper">Elisa & Jonas</p>
				</div>
				<div className="grid gap-3 p-5 sm:grid-cols-2">
					<article className="rounded-xl bg-sand px-4 py-3">
						<p className="font-display text-[10px] tracking-[0.2em] text-saffron uppercase">
							Ceremony
						</p>
						<p className="mt-1 font-display text-lg">Saturday 16:00</p>
						<p className="text-ink-soft text-sm">Ta’ Ċenċ · Gozo</p>
						<p className="mt-3 font-display text-xs text-sea">You’re invited</p>
					</article>
					<article className="rounded-xl bg-sand px-4 py-3">
						<p className="font-display text-[10px] tracking-[0.2em] text-saffron uppercase">
							Dinner
						</p>
						<p className="mt-1 font-display text-lg">Saturday 19:30</p>
						<p className="text-ink-soft text-sm">The terrace</p>
						<p className="mt-3 font-display text-xs text-sea">Reply for two</p>
					</article>
				</div>
				<div className="flex items-center justify-between border-t border-ink/10 px-5 py-3 text-xs text-ink-soft">
					<p>Personal link · not a search</p>
					<p>DE · EN · KU</p>
				</div>
			</div>
			<div className="absolute -right-2 -bottom-10 w-40 overflow-hidden rounded-3xl bg-ink shadow-[0_20px_50px_rgb(0_0_0/0.4)] ring-1 ring-paper/15 sm:right-[-1.5rem] sm:w-44">
				<div className="h-5 bg-ink" />
				<Image
					src="/studio/album.jpg"
					alt=""
					width={352}
					height={440}
					className="aspect-[4/5] w-full object-cover"
				/>
				<p className="px-3 py-2.5 font-display text-[11px] tracking-wide text-sand">Memories</p>
			</div>
		</div>
	);
}
