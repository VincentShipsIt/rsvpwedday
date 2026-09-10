import Image from "next/image";
import { GuestPreview } from "@/components/guest-preview";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TextLink } from "@/components/text-link";
import { studio } from "@/lib/brand";
import { features, offerings } from "@/lib/offer";

const steps = [
	{ n: "01", title: "Enquire", copy: "Dates, households, languages, the island or city." },
	{
		n: "02",
		title: "Hold",
		copy: "We option the house and the kitchen — or we put the site up the same week.",
	},
	{
		n: "03",
		title: "Invite",
		copy: "Personal links, not a name search. Children as counts. Meals for the caterer.",
	},
	{
		n: "04",
		title: "The day",
		copy: "Seating, a live wall, a photographer seat. We run it from one console.",
	},
];

export default function MarketingHome() {
	return (
		<div className="relative">
			<section className="relative min-h-[92dvh] text-paper">
				<Image
					src="/studio/cliff.jpg"
					alt="Limestone cliff over the sea at dusk"
					fill
					priority
					sizes="100vw"
					className="object-cover"
				/>
				<div className="absolute inset-0 bg-linear-to-b from-ink/55 via-ink/35 to-ink/80" />
				<div className="relative flex min-h-[92dvh] flex-col">
					<SiteHeader invert />
					<div className="mt-auto grid gap-10 px-6 pb-16 pt-24 md:grid-cols-12 md:px-12 md:pb-24">
						<p className="font-display text-xs font-semibold tracking-[0.28em] text-saffron uppercase md:col-span-3">
							{studio.places.join(" · ")}
						</p>
						<div className="md:col-span-9">
							<h1 className="max-w-4xl text-balance font-display text-5xl leading-[0.95] font-semibold tracking-tight md:text-7xl lg:text-8xl">
								{studio.hero}
							</h1>
							<p className="mt-5 max-w-3xl text-balance font-display text-3xl font-medium tracking-tight text-sand md:text-5xl">
								{studio.baseline}
							</p>
							<p className="mt-8 max-w-xl text-pretty text-lg text-sand/90 md:text-xl">
								Destination planning for households that span languages and islands. A private guest
								site on your domain — or we hold the house as well.
							</p>
						</div>
					</div>
				</div>
			</section>

			<main>
				<section
					id="site"
					className="scroll-mt-8 bg-ink px-6 py-24 text-paper md:px-12"
					aria-labelledby="site-heading"
				>
					<div className="grid items-center gap-16 lg:grid-cols-12">
						<div className="lg:col-span-5">
							<p className="font-display text-xs font-semibold tracking-[0.28em] text-saffron uppercase">
								The guest site
							</p>
							<h2
								id="site-heading"
								className="mt-4 text-balance font-display text-4xl font-semibold tracking-tight md:text-5xl"
							>
								Not a marketplace. A house for the weekend.
							</h2>
							<p className="mt-6 max-w-md text-pretty text-sand">
								Personal RSVP links. Per-event invitations. Children as a household count. A
								memories book. Gifts without a store. English, German, Kurmanji. Hosted on the
								couple’s domain.
							</p>
							<p className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
								<TextLink href={studio.guestSiteUrl} className="text-paper decoration-saffron">
									Open a live guest site
								</TextLink>
								<TextLink href="/prestations" className="text-paper decoration-saffron">
									See prestations
								</TextLink>
							</p>
						</div>
						<div className="pb-12 lg:col-span-7 lg:pb-4">
							<GuestPreview />
						</div>
					</div>
					<ul className="mt-24 grid gap-px bg-paper/10 sm:grid-cols-2 lg:grid-cols-3">
						{features.map((feature, index) => (
							<li key={feature.id} className="bg-ink p-6 md:p-8">
								<p className="font-display text-xs tracking-[0.2em] text-saffron">
									{String(index + 1).padStart(2, "0")}
								</p>
								<h3 className="mt-3 font-display text-xl font-semibold">{feature.title}</h3>
								<p className="mt-2 text-pretty text-sand/85">{feature.copy}</p>
							</li>
						))}
					</ul>
				</section>

				<section className="px-6 py-24 md:px-12" aria-labelledby="hold-heading">
					<div className="mb-12 flex flex-wrap items-end justify-between gap-6">
						<h2
							id="hold-heading"
							className="font-display text-3xl font-semibold tracking-tight md:text-4xl"
						>
							What we hold
						</h2>
						<p className="max-w-sm text-sm text-ink-soft">
							Full service, or the site alone. Never a vendor directory. Never a monthly app for the
							couple.
						</p>
					</div>
					<ul className="grid gap-8 lg:grid-cols-3">
						{offerings.map((offer) => (
							<li key={offer.id} className="flex flex-col border-t border-ink/15 pt-6">
								<p className="font-display text-xs tracking-[0.2em] text-saffron uppercase">
									{offer.kicker}
								</p>
								<h3 className="mt-2 font-display text-3xl font-semibold">{offer.name}</h3>
								<p className="mt-1 font-display text-lg text-ink-soft">From {offer.from}</p>
								<p className="mt-4 flex-1 text-pretty text-ink-soft">{offer.lede}</p>
								<p className="mt-6">
									<TextLink href={`/prestations#${offer.id}`}>What’s in it</TextLink>
								</p>
							</li>
						))}
					</ul>
				</section>

				<section className="grid md:grid-cols-2">
					<figure className="relative min-h-[28rem]">
						<Image
							src="/studio/table.jpg"
							alt="Long dinner table with dried citrus and olive"
							fill
							sizes="(min-width: 768px) 50vw, 100vw"
							className="object-cover"
						/>
					</figure>
					<figure className="relative min-h-[28rem]">
						<Image
							src="/studio/seal.jpg"
							alt="Sealed envelope and a gold ring in shuttered light"
							fill
							sizes="(min-width: 768px) 50vw, 100vw"
							className="object-cover"
						/>
					</figure>
				</section>

				<section className="px-6 py-24 md:px-12" aria-labelledby="steps-heading">
					<h2
						id="steps-heading"
						className="font-display text-3xl font-semibold tracking-tight md:text-4xl"
					>
						How a weekend starts
					</h2>
					<ol className="mt-12 grid gap-10 md:grid-cols-4">
						{steps.map((step) => (
							<li key={step.n}>
								<p className="font-display text-sm tracking-[0.2em] text-saffron">{step.n}</p>
								<h3 className="mt-3 font-display text-xl font-semibold">{step.title}</h3>
								<p className="mt-2 text-pretty text-ink-soft">{step.copy}</p>
							</li>
						))}
					</ol>
				</section>

				<section
					id="enquire"
					className="border-t border-ink/10 px-6 py-24 md:px-12"
					aria-labelledby="enquire-heading"
				>
					<h2
						id="enquire-heading"
						className="font-display text-4xl font-semibold tracking-tight md:text-6xl"
					>
						Write to the studio.
					</h2>
					<p className="mt-6 max-w-lg text-pretty text-lg text-ink-soft">
						Dates, roughly how many households, and whether you want the site alone or the house
						held too.
					</p>
					<p className="mt-8">
						<TextLink href={`mailto:${studio.enquiryEmail}`}>{studio.enquiryEmail}</TextLink>
					</p>
				</section>
			</main>
			<SiteFooter />
		</div>
	);
}
