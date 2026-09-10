import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TextLink } from "@/components/text-link";
import { studio } from "@/lib/brand";
import { extras, offerings } from "@/lib/offer";

export const metadata: Metadata = {
	title: `Pricing — ${studio.name}`,
	description:
		"Planning fees, not a couple subscription. Online only from €2,800. All in one from €14,000.",
};

export default function PricingPage() {
	return (
		<div>
			<SiteHeader />
			<main>
				<header className="px-6 py-16 md:px-12 md:py-24">
					<p className="font-display text-xs font-semibold tracking-[0.28em] text-saffron uppercase">
						Pricing
					</p>
					<h1 className="mt-4 max-w-3xl text-balance font-display text-5xl font-semibold tracking-tight md:text-7xl">
						A fee. Not a monthly app.
					</h1>
					<p className="mt-6 max-w-xl text-pretty text-lg text-ink-soft">
						Couples do not subscribe. We charge a planning fee, then a markup on what we book from
						our own roster. The site is included in every prestation.
					</p>
				</header>

				<section className="border-y border-ink/10" aria-labelledby="fees-heading">
					<h2 id="fees-heading" className="sr-only">
						Starting fees
					</h2>
					<ul className="grid md:grid-cols-3">
						{offerings.map((offer) => (
							<li
								key={offer.id}
								className="border-ink/10 px-6 py-12 md:border-r md:px-12 md:last:border-r-0"
							>
								<p className="font-display text-xs tracking-[0.2em] text-saffron uppercase">
									{offer.kicker}
								</p>
								<h3 className="mt-3 font-display text-3xl font-semibold">{offer.name}</h3>
								<p className="mt-8 font-display text-5xl tracking-tight">{offer.from}</p>
								<p className="mt-4 text-pretty text-ink-soft">{offer.lede}</p>
								<p className="mt-8">
									<TextLink href={`/prestations#${offer.id}`}>What’s included</TextLink>
								</p>
							</li>
						))}
					</ul>
				</section>

				<section className="grid md:grid-cols-2">
					<div className="px-6 py-20 md:px-12">
						<h2 className="font-display text-3xl font-semibold tracking-tight">What the fee is</h2>
						<ul className="mt-8 space-y-6 text-pretty text-ink-soft">
							<li>
								<strong className="font-display text-ink">Planning.</strong> Time on the calendar,
								the kitchen, the languages, the mail.
							</li>
							<li>
								<strong className="font-display text-ink">The site.</strong> Domain, RSVP, album,
								gifts, CMS. Not a per-guest licence.
							</li>
							<li>
								<strong className="font-display text-ink">Roster markup.</strong> Houses, kitchens,
								flowers, photo we actually work with. Quoted per weekend. You never see a vendor
								marketplace.
							</li>
						</ul>
					</div>
					<div className="bg-ink px-6 py-20 text-paper md:px-12">
						<h2 className="font-display text-3xl font-semibold tracking-tight">What it is not</h2>
						<ul className="mt-8 space-y-4 text-sand">
							<li>Not a couple monthly subscription.</li>
							<li>Not a public vendor directory.</li>
							<li>Not Zola, The Knot, or HoneyBook for the family.</li>
							<li>Not priced per guest sitting at the table.</li>
						</ul>
					</div>
				</section>

				<section className="px-6 py-20 md:px-12" aria-labelledby="extras-heading">
					<h2 id="extras-heading" className="font-display text-3xl font-semibold tracking-tight">
						Extras
					</h2>
					<ul className="mt-10">
						{extras.map((extra) => (
							<li
								key={extra.name}
								className="flex flex-wrap items-baseline justify-between gap-4 border-t border-ink/10 py-5 last:border-b"
							>
								<p className="font-display text-xl">{extra.name}</p>
								<p className="text-ink-soft">{extra.note}</p>
							</li>
						))}
					</ul>
				</section>

				<section className="border-t border-ink/10 px-6 py-24 md:px-12">
					<h2 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
						Ask for a number on your dates.
					</h2>
					<p className="mt-6 max-w-lg text-pretty text-lg text-ink-soft">
						Starting fees are the floor. Islands, household count and whether we hold the house move
						it.
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
