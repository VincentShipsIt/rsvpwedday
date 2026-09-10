import { TextLink } from "@/components/text-link";
import { studio } from "@/lib/brand";

const services = [
	{
		title: "The weekend",
		copy: "Ceremony, welcome dinner, brunch — sequenced against the actual calendar, not a checklist app.",
	},
	{
		title: "The house",
		copy: "Venues, tables, flowers, kitchens. We book our roster. You do not shop a marketplace.",
	},
	{
		title: "The site",
		copy: "A private guest site on your domain: RSVP per event, gifts, a memories book. No ads. No Knot.",
	},
];

const steps = [
	{ n: "01", title: "Enquire", copy: "Dates, households, languages, the island or city." },
	{
		n: "02",
		title: "Hold",
		copy: "We option the house and the kitchen. You get a site on a subdomain the same week.",
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
			<header className="flex items-end justify-between gap-6 px-6 py-6 md:px-12">
				<a href="#top" className="font-display text-xl font-semibold tracking-tight text-ink">
					{studio.name}
				</a>
				<nav aria-label="Primary" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
					<a href="#approach" className="text-ink-soft transition-colors hover:text-saffron">
						Approach
					</a>
					<a href="#site" className="text-ink-soft transition-colors hover:text-saffron">
						The site
					</a>
					<a href="#enquire" className="text-ink-soft transition-colors hover:text-saffron">
						Enquire
					</a>
				</nav>
			</header>

			<main id="top">
				<section className="grid gap-10 px-6 pb-24 pt-10 md:grid-cols-12 md:px-12 md:pt-20">
					<p className="font-display text-xs font-semibold tracking-[0.28em] text-saffron uppercase md:col-span-3">
						{studio.places.join(" · ")}
					</p>
					<div className="md:col-span-9">
						<h1 className="max-w-4xl text-balance font-display text-5xl leading-[0.95] font-semibold tracking-tight text-ink md:text-7xl lg:text-8xl">
							{studio.hero}
						</h1>
						<p className="mt-5 max-w-3xl text-balance font-display text-3xl font-medium tracking-tight text-ink-soft md:text-5xl">
							{studio.baseline}
						</p>
						<p className="mt-8 max-w-xl text-pretty text-lg text-ink-soft md:text-xl">
							Destination planning for households that span languages and islands. Private guest
							site — RSVP, gifts, album — on your own domain.
						</p>
					</div>
				</section>

				<section
					id="approach"
					className="border-t border-ink/10 px-6 py-20 md:px-12"
					aria-labelledby="approach-heading"
				>
					<div className="mb-14 flex items-baseline justify-between gap-4">
						<h2
							id="approach-heading"
							className="font-display text-3xl font-semibold tracking-tight md:text-4xl"
						>
							What we hold
						</h2>
						<p className="max-w-sm text-sm text-ink-soft">
							Full service. Not a vendor directory. Not a monthly app for the couple.
						</p>
					</div>
					<ul className="grid gap-px bg-ink/10 md:grid-cols-3">
						{services.map((service) => (
							<li key={service.title} className="bg-paper p-8">
								<h3 className="font-display text-2xl font-semibold">{service.title}</h3>
								<p className="mt-4 text-pretty text-ink-soft">{service.copy}</p>
							</li>
						))}
					</ul>
				</section>

				<section
					id="site"
					className="bg-ink px-6 py-20 text-paper md:px-12"
					aria-labelledby="site-heading"
				>
					<p className="font-display text-xs font-semibold tracking-[0.28em] text-saffron uppercase">
						Included with planning
					</p>
					<h2
						id="site-heading"
						className="mt-4 max-w-3xl text-balance font-display text-4xl font-semibold tracking-tight md:text-5xl"
					>
						A guest site that is not a marketplace.
					</h2>
					<p className="mt-6 max-w-xl text-pretty text-sand">
						Personal RSVP links. Per-event invitations. Children as a household count. A memories
						book. Gifts without a store. English, German, Kurmanji. Hosted on the couple’s domain —
						never on someone else’s ads.
					</p>
					<p className="mt-10">
						<TextLink href={studio.guestSiteUrl} className="text-paper decoration-saffron">
							Open a live guest site
						</TextLink>
					</p>
				</section>

				<section className="px-6 py-20 md:px-12" aria-labelledby="steps-heading">
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
						Dates, roughly how many households, and whether the weekend lives in one language or
						three.
					</p>
					<p className="mt-8">
						<TextLink href={`mailto:${studio.enquiryEmail}`}>{studio.enquiryEmail}</TextLink>
					</p>
				</section>
			</main>

			<footer className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 px-6 py-8 text-sm text-ink-soft md:px-12">
				<p>{studio.name}</p>
				<p>Planning console is private.</p>
			</footer>
		</div>
	);
}
