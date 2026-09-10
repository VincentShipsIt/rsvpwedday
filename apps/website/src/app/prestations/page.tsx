import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TextLink } from "@/components/text-link";
import { studio } from "@/lib/brand";
import { features, offerings } from "@/lib/offer";

export const metadata: Metadata = {
	title: `Prestations — ${studio.name}`,
	description: "Online only, the weekend, or all in one. The guest site is in every prestation.",
};

export default function PrestationsPage() {
	return (
		<div>
			<SiteHeader />
			<main className="px-6 pb-24 md:px-12">
				<header className="max-w-3xl py-16 md:py-24">
					<p className="font-display text-xs font-semibold tracking-[0.28em] text-saffron uppercase">
						Prestations
					</p>
					<h1 className="mt-4 text-balance font-display text-5xl font-semibold tracking-tight md:text-7xl">
						Online only, or we hold the house.
					</h1>
					<p className="mt-6 max-w-xl text-pretty text-lg text-ink-soft">
						The guest site is in every prestation. The difference is whether we also sequence the
						weekend and book from our roster.
					</p>
				</header>

				<ol className="flex flex-col gap-24">
					{offerings.map((offer, index) => (
						<li
							id={offer.id}
							key={offer.id}
							className="grid scroll-mt-8 gap-10 border-t border-ink/10 pt-12 lg:grid-cols-12"
						>
							<p className="font-display text-sm tracking-[0.2em] text-saffron lg:col-span-2">
								{String(index + 1).padStart(2, "0")}
							</p>
							<div className="lg:col-span-5">
								<h2 className="font-display text-4xl font-semibold tracking-tight">{offer.name}</h2>
								<p className="mt-2 text-ink-soft">{offer.kicker}</p>
								<p className="mt-6 text-pretty text-lg">{offer.lede}</p>
								<p className="mt-6 font-display text-2xl">From {offer.from}</p>
								<p className="mt-8">
									<TextLink href="/pricing">How we charge</TextLink>
								</p>
							</div>
							<ul className="lg:col-span-5">
								{offer.includes.map((line) => (
									<li key={line} className="border-b border-ink/10 py-3 text-pretty first:border-t">
										{line}
									</li>
								))}
							</ul>
						</li>
					))}
				</ol>

				<section className="mt-32" aria-labelledby="features-heading">
					<h2
						id="features-heading"
						className="font-display text-3xl font-semibold tracking-tight md:text-4xl"
					>
						On the guest site
					</h2>
					<ul className="mt-12 grid gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
						{features.map((feature) => (
							<li key={feature.id} className="bg-paper p-6 md:p-8">
								<h3 className="font-display text-xl font-semibold">{feature.title}</h3>
								<p className="mt-2 text-pretty text-ink-soft">{feature.copy}</p>
							</li>
						))}
					</ul>
				</section>
			</main>
			<SiteFooter />
		</div>
	);
}
