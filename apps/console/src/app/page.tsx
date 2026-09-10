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
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">Requests</p>
					<h1 className="mt-1 font-display text-4xl tracking-tight">All weddings</h1>
				</div>
				<p className="text-muted-foreground text-sm">
					Pipeline <span className="text-foreground tabular-nums">{euro.format(pipeline)}</span>
					<span> — fee plus margin on booked partners</span>
				</p>
			</header>

			<div className="mt-8 rounded-xl bg-card ring-1 ring-foreground/10">
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
								<TableCell className="text-muted-foreground">
									{statusLabel[request.status]}
								</TableCell>
								<TableCell className="tabular-nums">{euro.format(request.fee)}</TableCell>
								<TableCell className="tabular-nums">
									{euro.format(pipelineValue(request))}
								</TableCell>
								<TableCell className="whitespace-normal">
									<ul className="flex flex-wrap gap-1">
										{request.features.map((flag) => (
											<li key={flag}>
												<Badge variant="secondary">{featureLabels[flag]}</Badge>
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
		</ConsoleShell>
	);
}
