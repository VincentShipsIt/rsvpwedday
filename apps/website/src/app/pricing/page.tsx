import type { Metadata } from "next";
import { Eyebrow } from "@/components/eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TextLink } from "@/components/text-link";
import { studio } from "@/lib/brand";
import { extras, offerings } from "@/lib/offer";

export const metadata: Metadata = {
	title: `Pricing — ${studio.name}`,
	description:
		"A planning fee, then markup on the house. The weekend from €8,500. All in one from €14,000. Malta.",
};

export default function PricingPage() {
	return (
		<div>
			<SiteHeader />
			<main>
				<header className="px-6 py-20 md:px-12 md:py-28">
					<Eyebrow>Pricing</Eyebrow>
					<h1 className="display mt-7 max-w-4xl text-[clamp(2.75rem,7vw,6rem)]">
						A planning fee. Then the <em className="italic">house.</em>
					</h1>
					<p className="mt-8 max-w-md text-pretty text-[15px] text-ink-soft">
						You are quoted once for the weekend, and again on anything we book for you. No second
						invoice arrives that you did not see coming.
					</p>
				</header>

				<section className="border-t border-ink/12" aria-labelledby="fees-heading">
					<h2 id="fees-heading" className="sr-only">
						Starting fees
					</h2>
					<ul className="grid md:grid-cols-2">
						{offerings.map((offer) => (
							<li
								key={offer.id}
								className="border-b border-ink/12 px-6 py-14 md:border-r md:border-b-0 md:px-12 md:last:border-r-0"
							>
								<Eyebrow>{offer.kicker}</Eyebrow>
								<h3 className="display-sm mt-4 text-2xl">{offer.name}</h3>
								<p className="display mt-10 text-[clamp(2.5rem,4.4vw,3.5rem)] tabular-nums">
									From {offer.from}
								</p>
								<p className="mt-5 text-pretty text-[15px] text-ink-soft">{offer.lede}</p>
								<p className="mt-8">
									<TextLink href={`/prestations#${offer.id}`}>What&rsquo;s included</TextLink>
								</p>
							</li>
						))}
					</ul>
				</section>

				<section className="grid md:grid-cols-2">
					<div className="px-6 py-24 md:px-12">
						<Eyebrow>What the fee is</Eyebrow>
						<h2 className="display mt-6 text-[clamp(2rem,3.6vw,2.75rem)]">
							Time on the <em className="italic">weekend.</em>
						</h2>
						<ul className="mt-10 flex flex-col gap-7 text-pretty text-[15px] text-ink-soft">
							<li>
								<strong className="display-sm block text-lg text-ink">Planning</strong>
								Finding the house, sitting down with the chef, holding the order of the days, and
								answering your family.
							</li>
							<li>
								<strong className="display-sm block text-lg text-ink">Roster markup</strong>
								The people we have worked beside for years — the house, the chef, the florist, the
								photographer. Quoted per weekend, before we book.
							</li>
							<li>
								<strong className="display-sm block text-lg text-ink">
									Never a bill each month
								</strong>
								One fee, then the house. Nothing arrives every month.
							</li>
						</ul>
					</div>
					<div className="bg-dusk px-6 py-24 text-ivory md:px-12">
						<Eyebrow className="text-dusk-soft">What it is not</Eyebrow>
						<h2 className="display mt-6 text-[clamp(2rem,3.6vw,2.75rem)]">
							Three things we <em className="italic">never do.</em>
						</h2>
						<ul className="mt-10 text-[15px] text-dusk-soft">
							<li className="border-b border-ivory/15 py-4 first:border-t">
								A monthly subscription for the couple.
							</li>
							<li className="border-b border-ivory/15 py-4">A public vendor directory.</li>
							<li className="border-b border-ivory/15 py-4">
								A price per guest sitting at the table.
							</li>
						</ul>
					</div>
				</section>

				<section className="px-6 py-24 md:px-12" aria-labelledby="extras-heading">
					<Eyebrow>Extras</Eyebrow>
					<h2 id="extras-heading" className="display mt-6 text-[clamp(2rem,3.6vw,2.75rem)]">
						Quoted on the <em className="italic">weekend.</em>
					</h2>
					<ul className="mt-12">
						{extras.map((extra) => (
							<li
								key={extra.name}
								className="flex flex-wrap items-baseline justify-between gap-4 border-t border-ink/12 py-5 last:border-b"
							>
								<p className="display-sm text-xl">{extra.name}</p>
								<p className="text-[14px] text-ink-soft">{extra.note}</p>
							</li>
						))}
					</ul>
				</section>

				<section className="border-t border-ink/12 px-6 py-24 md:px-12 md:py-32">
					<Eyebrow>Enquire</Eyebrow>
					<h2 className="display mt-6 text-[clamp(2.5rem,6vw,5rem)]">
						Ask for a number on your <em className="italic">dates.</em>
					</h2>
					<p className="mt-8 max-w-md text-pretty text-[15px] text-ink-soft">
						A starting fee is a floor, not a quote. How many of you, which house, and whether we go
						and find it will all move the number.
					</p>
					<p className="mt-10">
						<TextLink href={`mailto:${studio.enquiryEmail}`}>{studio.enquiryEmail}</TextLink>
					</p>
				</section>
			</main>
			<SiteFooter />
		</div>
	);
}
