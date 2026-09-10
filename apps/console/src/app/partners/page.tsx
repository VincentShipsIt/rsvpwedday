import { ConsoleShell } from "@/components/console-shell";
import { categoryLabels, partners } from "@/lib/mock";

export default function PartnersPage() {
	return (
		<ConsoleShell active="/partners">
			<p className="text-xs tracking-[0.2em] text-saffron uppercase">Roster</p>
			<h1 className="mt-1 font-display text-4xl tracking-tight">Partners</h1>
			<p className="mt-2 max-w-xl text-ink-soft">
				Houses, kitchens, flowers, photographers we actually work with. Not a public directory.
				Booking onto a wedding comes after the tenant lands.
			</p>
			<ul className="mt-10 grid gap-4 md:grid-cols-2">
				{partners.map((partner) => (
					<li key={partner.id} className="rounded-xl border border-line bg-panel p-5">
						<p className="text-xs tracking-wide text-saffron uppercase">
							{categoryLabels[partner.category]}
						</p>
						<h2 className="mt-1 font-display text-2xl">{partner.name}</h2>
						<p className="text-sm text-ink-soft">{partner.place}</p>
						<p className="mt-3 text-pretty text-ink-soft">{partner.note}</p>
					</li>
				))}
			</ul>
		</ConsoleShell>
	);
}
