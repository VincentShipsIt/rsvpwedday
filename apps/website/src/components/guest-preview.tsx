import Image from "next/image";

/*
 * The couple's own site, shown as an object rather than a screenshot in fake
 * browser chrome — the traffic-light window is a SaaS convention and reads as
 * a product demo. The album sits beside the frame rather than floating over
 * it: an overlay here covers the second event card, and two things laid flat
 * beside each other is the calmer read anyway.
 */
export function GuestPreview() {
	return (
		<div className="mx-auto flex w-full max-w-2xl items-end gap-5">
			<div className="min-w-0 flex-1 border border-champagne/45 bg-ivory text-ink">
				<p className="border-b border-ink/10 px-5 py-3 text-[9px] font-medium tracking-[0.28em] text-ink-soft uppercase">
					elisajonas.com
				</p>
				<div className="relative h-44 overflow-hidden">
					<Image
						src="/studio/cliff.jpg"
						alt=""
						fill
						sizes="(min-width: 1024px) 40vw, 90vw"
						className="object-cover"
					/>
					<div className="absolute inset-0 bg-dusk/40" />
					<p className="display absolute bottom-4 left-5 text-3xl text-ivory">
						Elisa &amp; <em className="italic">Jonas</em>
					</p>
				</div>
				<div className="grid sm:grid-cols-2">
					<article className="border-b border-ink/10 px-5 py-4 sm:border-r sm:border-b-0">
						<p className="text-[9px] font-medium tracking-[0.26em] text-ink-soft uppercase">
							Ceremony
						</p>
						<p className="display-sm mt-2 text-xl">Saturday 16:00</p>
						<p className="text-[13px] text-ink-soft">Ta&rsquo; Ċenċ · Gozo</p>
						<p className="mt-3 text-[13px]">You&rsquo;re invited</p>
					</article>
					<article className="px-5 py-4">
						<p className="text-[9px] font-medium tracking-[0.26em] text-ink-soft uppercase">
							Dinner
						</p>
						<p className="display-sm mt-2 text-xl">Saturday 19:30</p>
						<p className="text-[13px] text-ink-soft">The terrace</p>
						<p className="mt-3 text-[13px]">Reply for two</p>
					</article>
				</div>
				<div className="flex items-center justify-between border-t border-ink/10 px-5 py-3 text-[10px] tracking-[0.12em] text-ink-soft uppercase">
					<p>Personal link</p>
					<p>Reply for two</p>
				</div>
			</div>
			<div className="hidden w-36 shrink-0 translate-y-8 border border-champagne/45 bg-ivory sm:block">
				<Image
					src="/studio/album.jpg"
					alt=""
					width={352}
					height={440}
					className="aspect-[4/5] w-full object-cover"
				/>
				<p className="px-3 py-2.5 text-[9px] font-medium tracking-[0.26em] text-ink-soft uppercase">
					Memories
				</p>
			</div>
		</div>
	);
}
