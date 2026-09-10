import { Badge } from "@rsvpwedday/ui/badge";
import { Button } from "@rsvpwedday/ui/button";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@rsvpwedday/ui/table";
import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";
import { euro, featureLabels, pipelineValue, requests } from "@/lib/mock";

const statusLabel = {
	option: "Option",
	confirmed: "Confirmed",
	"day-of": "Day-of",
} as const;

export default function RequestsPage() {
	const pipeline = requests.reduce((sum, request) => sum + pipelineValue(request), 0);

	return (
		<ConsoleShell active="/">
			<div className="flex flex-col gap-8">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h1 className="font-display text-3xl font-semibold tracking-tight">Requests</h1>
						<p className="text-ink-soft mt-1 font-serif text-sm">
							Fee plus margin on booked partners.
						</p>
					</div>
					<p className="font-serif text-sm">
						Pipeline{" "}
						<span className="font-sans font-medium tabular-nums">{euro.format(pipeline)}</span>
					</p>
				</div>

				<div className="rounded-xl bg-card ring-1 ring-foreground/10">
					<Table>
						<TableCaption className="sr-only">
							Client requests with fees, pipeline value, and enabled features
						</TableCaption>
						<TableHeader>
							<TableRow>
								<TableHead>Client</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Fee</TableHead>
								<TableHead>Pipeline</TableHead>
								<TableHead>Features</TableHead>
								<TableHead>
									<span className="sr-only">Open</span>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{requests.map((request) => (
								<TableRow key={request.id}>
									<TableCell>
										<p className="font-medium">{request.couple}</p>
										<p className="text-muted-foreground text-xs">
											{request.place} · {request.date}
										</p>
									</TableCell>
									<TableCell>
										<Badge variant="secondary">{statusLabel[request.status]}</Badge>
									</TableCell>
									<TableCell className="tabular-nums">{euro.format(request.fee)}</TableCell>
									<TableCell className="tabular-nums">
										{euro.format(pipelineValue(request))}
									</TableCell>
									<TableCell className="text-pretty whitespace-normal">
										<ul className="flex flex-wrap gap-1">
											{request.features.map((flag) => (
												<li key={flag}>
													<Badge variant="outline">{featureLabels[flag]}</Badge>
												</li>
											))}
										</ul>
									</TableCell>
									<TableCell className="text-right">
										<Button variant="outline" size="sm" asChild>
											<Link href={`/requests/${request.id}`}>Open</Link>
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		</ConsoleShell>
	);
}
