import { Badge } from "@rsvpwedday/ui/badge";
import { Button } from "@rsvpwedday/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@rsvpwedday/ui/card";
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
			<div className="flex flex-col gap-8">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-2xl font-medium">{request.couple}</h1>
						<p className="text-muted-foreground mt-1 text-sm">
							{request.place} · {request.date} · {request.domain}
						</p>
					</div>
					<Button asChild>
						<a href={request.guestOrigin} target="_blank" rel="noreferrer">
							Open guest site
						</a>
					</Button>
				</div>

				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					{figures.map(([label, value]) => (
						<Card key={label}>
							<CardHeader className="pb-2">
								<CardTitle className="text-muted-foreground text-xs font-normal">{label}</CardTitle>
							</CardHeader>
							<CardContent className="text-2xl font-semibold tabular-nums">{value}</CardContent>
						</Card>
					))}
				</div>
				<p className="text-muted-foreground text-sm">
					Partner margin on confirmed bookings{" "}
					<span className="text-foreground tabular-nums">{euro.format(margin)}</span>. Couples never
					see these figures.
				</p>

				<section aria-labelledby="features-heading">
					<h2 id="features-heading" className="text-lg font-medium">
						Features on this site
					</h2>
					<ul className="mt-3 flex flex-wrap gap-2">
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
			</div>
		</ConsoleShell>
	);
}
