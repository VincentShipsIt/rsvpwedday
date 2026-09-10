import { ConsoleShell } from "@/components/console-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const thread = [
	{
		who: "You",
		text: "Saturday dinner is 84 adults, 11 children, 6 vegan. Move welcome drinks thirty minutes later.",
	},
	{
		who: "Agent",
		text: "Draft only — nothing is saved until you confirm. Headcount 84 + 11. Welcome drinks 18:00 → 18:30. I have not emailed the kitchen.",
	},
];

export default function AgentPage() {
	return (
		<ConsoleShell active="/agent">
			<p className="text-xs tracking-[0.2em] text-saffron uppercase">Console</p>
			<h1 className="mt-1 font-display text-4xl tracking-tight">Agent</h1>
			<p className="mt-2 max-w-xl text-ink-soft">
				Drafts timelines, headcounts, and translations into the CMS locales. It does not write until
				you confirm. It is not on the guest site.
			</p>

			<div className="mt-10 max-w-2xl rounded-xl border border-line bg-panel">
				<ul className="flex flex-col gap-6 p-6">
					{thread.map((turn) => (
						<li key={turn.text}>
							<p className="text-xs tracking-wide text-saffron uppercase">{turn.who}</p>
							<p className="mt-1 text-pretty">{turn.text}</p>
						</li>
					))}
				</ul>
				<div className="flex gap-2 border-t border-line p-4">
					<label htmlFor="agent-draft" className="sr-only">
						Ask the agent
					</label>
					<Input
						id="agent-draft"
						name="draft"
						placeholder="Translate the site to German…"
						readOnly
						aria-describedby="agent-preview-note"
					/>
					<Button type="button" variant="outline" disabled>
						Draft
					</Button>
				</div>
				<p id="agent-preview-note" className="px-4 pb-4 text-xs text-ink-soft">
					Preview only. Confirm-before-write lands with the AI ops epic.
				</p>
			</div>
		</ConsoleShell>
	);
}
