import { notFound } from "next/navigation";
import { ConsoleShell } from "@/components/console-shell";
import { ButtonLink } from "@/components/ui/button";
import { euro, featureLabels, pipelineValue, requests } from "@/lib/mock";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const request = requests.find((item) => item.id === id);
	if (!request) notFound();

	const margin = request.bookedVendorTotal - request.ourCost;

	return (
		<ConsoleShell active="/">
			<p className="text-xs tracking-[0.2em] text-saffron uppercase">Request</p>
			<h1 className="mt-1 font-display text-4xl tracking-tight">{request.couple}</h1>
			<p className="mt-1 text-ink-soft">
				{request.place} · {request.date} · {request.domain}
			</p>

			<dl className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-4">
				{[
					["Fee", euro.format(request.fee)],
					["Budget", euro.format(request.budget)],
					["Booked (couple)", euro.format(request.bookedVendorTotal)],
					["Pipeline", euro.format(pipelineValue(request))],
				].map(([label, value]) => (
					<div key={label} className="bg-panel p-5">
						<dt className="text-xs tracking-wide text-ink-soft uppercase">{label}</dt>
						<dd className="mt-1 font-display text-3xl tabular-nums">{value}</dd>
					</div>
				))}
			</dl>
			<p className="mt-3 text-sm text-ink-soft">
				Partner margin on confirmed bookings{" "}
				<span className="tabular-nums text-ink">{euro.format(margin)}</span>. Couples never see
				these figures.
			</p>

			<section className="mt-12" aria-labelledby="features-heading">
				<h2 id="features-heading" className="font-display text-2xl">
					Features on this site
				</h2>
				<ul className="mt-4 flex flex-wrap gap-2">
					{(Object.keys(featureLabels) as Array<keyof typeof featureLabels>).map((flag) => {
						const on = request.features.includes(flag);
						return (
							<li
								key={flag}
								className={
									on
										? "rounded-full bg-sea px-3 py-1 text-sm text-paper"
										: "rounded-full border border-line px-3 py-1 text-sm text-ink-soft"
								}
							>
								{featureLabels[flag]}
								<span className="sr-only">{on ? " enabled" : " disabled"}</span>
							</li>
						);
					})}
				</ul>
			</section>

			<p className="mt-10">
				<ButtonLink href={request.guestOrigin} variant="saffron" external>
					Open guest site
				</ButtonLink>
			</p>
		</ConsoleShell>
	);
}
