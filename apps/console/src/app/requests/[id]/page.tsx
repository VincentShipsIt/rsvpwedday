import { Badge } from "@rsvpwedday/ui/badge";
import { Button } from "@rsvpwedday/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@rsvpwedday/ui/card";
import { notFound } from "next/navigation";
import { ConsoleShell } from "@/components/console-shell";
import { euro, featureLabels, pipelineValue, requests } from "@/lib/mock";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const request = requests.find((item) => item.id === id);
	if (!request) notFound();

	const margin = request.bookedVendorTotal - request.ourCost;
	const figures = [
		["Fee", euro.format(request.fee)],
		["Budget", euro.format(request.budget)],
		["Booked (couple)", euro.format(request.bookedVendorTotal)],
		["Pipeline", euro.format(pipelineValue(request))],
	] as const;

	return (
		<ConsoleShell active="/">
			<p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">Request</p>
			<h1 className="mt-1 font-display text-4xl tracking-tight">{request.couple}</h1>
			<p className="text-muted-foreground mt-1">
				{request.place} · {request.date} · {request.domain}
			</p>

			<div className="mt-10 grid gap-4 md:grid-cols-4">
				{figures.map(([label, value]) => (
					<Card key={label} size="sm">
						<CardHeader>
							<CardDescription>{label}</CardDescription>
							<CardTitle className="font-display text-3xl tabular-nums">{value}</CardTitle>
						</CardHeader>
					</Card>
				))}
			</div>
			<p className="text-muted-foreground mt-3 text-sm">
				Partner margin on confirmed bookings{" "}
				<span className="text-foreground tabular-nums">{euro.format(margin)}</span>. Couples never
				see these figures.
			</p>

			<section className="mt-12" aria-labelledby="features-heading">
				<h2 id="features-heading" className="font-display text-2xl">
					Features on this site
				</h2>
				<ul className="mt-4 flex flex-wrap gap-2">
					{(Object.keys(featureLabels) as Array<keyof typeof featureLabels>).map((flag) => {
						const on = request.features.includes(flag);
						return (
							<li key={flag}>
								<Badge variant={on ? "default" : "outline"}>
									{featureLabels[flag]}
									<span className="sr-only">{on ? " enabled" : " disabled"}</span>
								</Badge>
							</li>
						);
					})}
				</ul>
			</section>

			<p className="mt-10">
				<Button asChild>
					<a href={request.guestOrigin} target="_blank" rel="noreferrer">
						Open guest site
					</a>
				</Button>
			</p>
		</ConsoleShell>
	);
}
