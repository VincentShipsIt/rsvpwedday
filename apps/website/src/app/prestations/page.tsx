import type { Metadata } from "next";
import { Eyebrow } from "@/components/eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TextLink } from "@/components/text-link";
import { studio } from "@/lib/brand";
import { offerings, services } from "@/lib/offer";

export const metadata: Metadata = {
	title: `Prestations — ${studio.name}`,
	description: "All-inclusive wedding planning in Malta. The weekend, or we hold the house.",
};

export default function PrestationsPage() {
	return (
		<div>
			<SiteHeader />
			<main className="px-6 pb-28 md:px-12">
				<header className="max-w-3xl py-20 md:py-28">
					<Eyebrow>Prestations</Eyebrow>
					<h1 className="display mt-7 text-[clamp(2.75rem,7vw,6rem)]">
						All in. We hold the <em className="italic">house.</em>
					</h1>
					<p className="mt-8 max-w-md text-pretty text-[15px] text-ink-soft">
						Both of them take the whole weekend off your hands. The only question is whether the
						house is already yours, or whether we go and find it.
					</p>
				</header>

				<ul className="flex flex-col gap-24">
					{offerings.map((offer) => (
						<li
							id={offer.id}
							key={offer.id}
							className="grid scroll-mt-8 gap-x-12 gap-y-10 border-t border-ink/20 pt-12 lg:grid-cols-12"
						>
							<div className="lg:col-span-5">
								<Eyebrow>{offer.kicker}</Eyebrow>
								<h2 className="display mt-4 text-[clamp(2rem,3.4vw,2.75rem)]">{offer.name}</h2>
								<p className="mt-6 text-pretty text-[15px] text-ink-soft">{offer.lede}</p>
								<p className="display-sm mt-8 text-2xl">From {offer.from}</p>
								<p className="mt-8">
									<TextLink href="/pricing">How we charge</TextLink>
								</p>
							</div>
							<ul className="text-[15px] lg:col-span-6 lg:col-start-7">
								{offer.includes.map((line) => (
									<li
										key={line}
										className="border-b border-ink/12 py-3.5 text-pretty first:border-t"
									>
										{line}
									</li>
								))}
							</ul>
						</li>
					))}
				</ul>

				<section className="mt-32" aria-labelledby="services-heading">
					<Eyebrow>On every weekend</Eyebrow>
					<h2 id="services-heading" className="display mt-6 text-[clamp(2.25rem,4.6vw,3.5rem)]">
						What we actually <em className="italic">do.</em>
					</h2>
					<ul className="mt-14 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-4">
						{services.map((service) => (
							<li key={service.id} className="border-t border-ink/20 py-6">
								<h3 className="display-sm text-xl">{service.title}</h3>
								<p className="mt-2 text-pretty text-[14px] text-ink-soft">{service.copy}</p>
							</li>
						))}
					</ul>
				</section>
			</main>
			<SiteFooter />
		</div>
	);
}
