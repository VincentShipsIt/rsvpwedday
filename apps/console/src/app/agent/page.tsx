import { Button } from "@rsvpwedday/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@rsvpwedday/ui/card";
import { Input } from "@rsvpwedday/ui/input";
import { Label } from "@rsvpwedday/ui/label";
import { ConsoleShell } from "@/components/console-shell";

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
			<div className="flex flex-col gap-8">
				<div>
					<h1 className="font-display text-3xl font-semibold tracking-tight">Agent</h1>
					<p className="text-ink-soft mt-1 max-w-2xl font-serif text-sm">
						Drafts timelines, headcounts, and translations into the CMS locales. It does not write
						until you confirm. It is not on the guest site.
					</p>
				</div>

				<Card className="max-w-2xl">
					<CardHeader className="sr-only">
						<p>Preview conversation</p>
					</CardHeader>
					<CardContent>
						<ul className="flex flex-col gap-6">
							{thread.map((turn) => (
								<li key={turn.text}>
									<p className="text-muted-foreground text-xs font-medium">{turn.who}</p>
									<p className="mt-1 font-serif text-pretty">{turn.text}</p>
								</li>
							))}
						</ul>
					</CardContent>
					<CardFooter className="flex-col items-stretch gap-2">
						<div className="flex gap-2">
							<Label htmlFor="agent-draft" className="sr-only">
								Ask the agent
							</Label>
							<Input
								id="agent-draft"
								name="draft"
								className="min-w-0 flex-1"
								placeholder="Translate the site to German…"
								readOnly
								aria-describedby="agent-preview-note"
							/>
							<Button type="button" variant="outline" disabled>
								Draft
							</Button>
						</div>
						<p id="agent-preview-note" className="text-muted-foreground text-xs">
							Preview only. Confirm-before-write lands with the AI ops epic.
						</p>
					</CardFooter>
				</Card>
			</div>
		</ConsoleShell>
	);
}
