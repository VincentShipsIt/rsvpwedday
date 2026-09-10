import { ConsoleShell } from "@/components/console-shell";
import { ButtonLink } from "@/components/ui/button";
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
					<p className="text-xs tracking-[0.2em] text-saffron uppercase">Requests</p>
					<h1 className="mt-1 font-display text-4xl tracking-tight">All weddings</h1>
				</div>
				<p className="text-sm text-ink-soft">
					Pipeline <span className="tabular-nums text-ink">{euro.format(pipeline)}</span>
					<span className="text-ink-soft"> — fee plus margin on booked partners</span>
				</p>
			</header>

			<div className="mt-8 overflow-x-auto rounded-xl border border-line bg-panel">
				<table className="w-full min-w-[52rem] text-left text-sm">
					<caption className="sr-only">
						Client requests with fees, pipeline value, and enabled features
					</caption>
					<thead className="border-b border-line text-xs tracking-wide text-ink-soft uppercase">
						<tr>
							<th className="px-4 py-3 font-medium">Client</th>
							<th className="px-4 py-3 font-medium">Status</th>
							<th className="px-4 py-3 font-medium">Fee</th>
							<th className="px-4 py-3 font-medium">Pipeline</th>
							<th className="px-4 py-3 font-medium">Features</th>
							<th className="px-4 py-3 font-medium">
								<span className="sr-only">Open</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{requests.map((request) => (
							<tr key={request.id} className="border-b border-line last:border-0">
								<td className="px-4 py-3">
									<p className="font-medium">{request.couple}</p>
									<p className="text-xs text-ink-soft">
										{request.place} · {request.date}
									</p>
								</td>
								<td className="px-4 py-3 text-ink-soft">{statusLabel[request.status]}</td>
								<td className="px-4 py-3 tabular-nums">{euro.format(request.fee)}</td>
								<td className="px-4 py-3 tabular-nums">{euro.format(pipelineValue(request))}</td>
								<td className="px-4 py-3">
									<ul className="flex flex-wrap gap-1">
										{request.features.map((flag) => (
											<li
												key={flag}
												className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] text-ink-soft"
											>
												{featureLabels[flag]}
											</li>
										))}
									</ul>
								</td>
								<td className="px-4 py-3 text-right">
									<ButtonLink href={`/requests/${request.id}`} variant="outline" size="sm">
										Open
									</ButtonLink>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</ConsoleShell>
	);
}
