import Image from "next/image";
import { Eyebrow } from "@/components/eyebrow";
import { GuestPreview } from "@/components/guest-preview";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TextLink } from "@/components/text-link";
import { studio } from "@/lib/brand";
import { offerings, services } from "@/lib/offer";

const steps = [
	{
		n: "I",
		title: "Write",
		copy: "Your date, or the month you keep circling. We answer with what is still free.",
	},
	{
		n: "II",
		title: "Hold",
		copy: "We put the house and the chef on hold before anyone else can reach them.",
	},
	{
		n: "III",
		title: "Taste",
		copy: "You sit down once — the menu, the flowers, the table — and then it is settled.",
	},
	{
		n: "IV",
		title: "The day",
		copy: "We arrive before you wake. You spend it as a guest at your own wedding.",
	},
];

export default function MarketingHome() {
	return (
		<div className="relative">
			<section className="relative min-h-[88dvh] text-ivory">
				<Image
					src="/studio/couple.jpg"
					alt="A couple holding hands in the last of the light, lace against a dark suit"
					fill
					priority
					sizes="100vw"
					className="object-cover"
				/>
				{/* Two scrims, not one. The vertical pass seats the header and the section
					    below it; the horizontal pass darkens only the left third, where the type
					    lives, so the laid table keeps its own light on the right rather than
					    being flattened under a full-frame wash. */}
				<div className="absolute inset-0 bg-linear-to-b from-dusk/65 via-dusk/25 to-dusk/85" />
				<div className="absolute inset-0 bg-linear-to-r from-dusk/85 via-dusk/40 to-transparent" />
				<div className="relative flex min-h-[88dvh] flex-col">
					<SiteHeader invert />
					<div className="mt-auto px-6 pt-24 pb-16 md:px-12 md:pb-20">
						<Eyebrow className="text-ivory/60">{studio.descriptor}</Eyebrow>
						<h1 className="display mt-7 text-[clamp(3.5rem,13vw,11rem)]">
							You said <em className="italic">Yes.</em>
						</h1>
						<div className="mt-9 h-px w-24 bg-champagne/70" />
						<p className="mt-7 max-w-sm text-pretty text-[15px] text-ivory/75">
							Everything after that is ours — the house, the chef, the three days, and the hundred
							small decisions nobody warns you about.
						</p>
					</div>
				</div>
			</section>

			<main>
				<section
					id="hold"
					className="scroll-mt-8 px-6 py-24 md:px-12 md:py-32"
					aria-labelledby="hold-heading"
				>
					<div className="mb-16 max-w-3xl">
						<Eyebrow>What we hold</Eyebrow>
						<h2 id="hold-heading" className="display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)]">
							You hand it over <em className="italic">once.</em>
						</h2>
						<p className="mt-7 max-w-md text-pretty text-[15px] text-ink-soft">
							One studio for the whole weekend, from the first visit to the last car.
						</p>
					</div>
					<ul className="grid gap-x-12 sm:grid-cols-2 lg:grid-cols-4">
						{services.map((service) => (
							<li key={service.id} className="border-t border-ink/20 py-6">
								<h3 className="display-sm text-xl">{service.title}</h3>
								<p className="mt-2 text-pretty text-[14px] text-ink-soft">{service.copy}</p>
							</li>
						))}
					</ul>
				</section>

				<section className="grid md:grid-cols-2" aria-label="The studio">
					<figure className="relative min-h-[30rem]">
						<Image
							src="/studio/table.jpg"
							alt="A long terrace table laid for dinner above the sea, candles lit at dusk"
							fill
							sizes="(min-width: 768px) 50vw, 100vw"
							className="object-cover"
						/>
					</figure>
					<figure className="relative min-h-[30rem]">
						<Image
							src="/studio/seal.jpg"
							alt="A sealed envelope and a gold ring in shuttered light"
							fill
							sizes="(min-width: 768px) 50vw, 100vw"
							className="object-cover"
						/>
					</figure>
				</section>

				<section className="px-6 py-24 md:px-12 md:py-32" aria-labelledby="offer-heading">
					<div className="mb-16 max-w-3xl">
						<Eyebrow>Prestations</Eyebrow>
						<h2 id="offer-heading" className="display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)]">
							Two ways. Both of them <em className="italic">whole.</em>
						</h2>
					</div>
					<ul className="grid gap-x-12 gap-y-14 lg:grid-cols-2">
						{offerings.map((offer) => (
							<li key={offer.id} className="flex flex-col border-t border-ink/20 pt-7">
								<Eyebrow>{offer.kicker}</Eyebrow>
								<h3 className="display mt-4 text-[2rem]">{offer.name}</h3>
								<p className="mt-5 flex-1 text-pretty text-[15px] text-ink-soft">{offer.lede}</p>
								<p className="display-sm mt-8 text-2xl">From {offer.from}</p>
								<p className="mt-8">
									<TextLink href={`/prestations#${offer.id}`}>What&rsquo;s in it</TextLink>
								</p>
							</li>
						))}
					</ul>
				</section>

				<section
					id="family"
					className="scroll-mt-8 bg-dusk px-6 py-24 text-ivory md:px-12 md:py-32"
					aria-labelledby="family-heading"
				>
					<div className="grid items-center gap-x-16 gap-y-20 lg:grid-cols-12">
						<div className="lg:col-span-5">
							<Eyebrow className="text-dusk-soft">For the family</Eyebrow>
							<h2 id="family-heading" className="display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)]">
								They know where to <em className="italic">be.</em>
							</h2>
							<p className="mt-8 max-w-md text-pretty text-[15px] text-dusk-soft">
								Your family gets a private page under your own name, where they reply, say what they
								cannot eat and find out where to be. It arrives with the weekend.
							</p>
							<p className="mt-10">
								<TextLink
									href={studio.guestSiteUrl}
									className="border-ivory/30 text-ivory hover:border-ivory"
								>
									A weekend, as the family sees it
								</TextLink>
							</p>
						</div>
						<div className="pb-14 lg:col-span-7 lg:pb-6">
							<GuestPreview />
						</div>
					</div>
				</section>

				<section className="px-6 py-24 md:px-12 md:py-32" aria-labelledby="steps-heading">
					<Eyebrow>In order</Eyebrow>
					<h2 id="steps-heading" className="display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)]">
						How a weekend <em className="italic">starts.</em>
					</h2>
					<ol className="mt-16 grid gap-x-12 gap-y-12 md:grid-cols-4">
						{steps.map((step) => (
							<li key={step.n} className="border-t border-ink/20 pt-7">
								<p className="display-sm text-sm tracking-[0.2em] text-ink-soft">{step.n}</p>
								<h3 className="display-sm mt-4 text-2xl">{step.title}</h3>
								<p className="mt-3 text-pretty text-[14px] text-ink-soft">{step.copy}</p>
							</li>
						))}
					</ol>
				</section>

				<section
					id="enquire"
					className="border-t border-ink/12 px-6 py-24 md:px-12 md:py-32"
					aria-labelledby="enquire-heading"
				>
					<Eyebrow>Enquire</Eyebrow>
					<h2 id="enquire-heading" className="display mt-6 text-[clamp(2.75rem,6.5vw,5.5rem)]">
						Write to the <em className="italic">studio.</em>
					</h2>
					<p className="mt-8 max-w-md text-pretty text-[15px] text-ink-soft">
						Tell us the date, or the month you keep circling, and roughly how many of you there will
						be. We will write back with what is still free.
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
