import { Button } from "@rsvpwedday/ui/button";
import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";

export default function NotFound() {
	return (
		<ConsoleShell pathname="/">
			<div className="flex flex-col gap-4">
				<h1 className="font-display text-3xl font-semibold tracking-tight">Nothing here</h1>
				<p>
					<Button variant="outline" asChild>
						<Link href="/">Back to the agent</Link>
					</Button>
				</p>
			</div>
		</ConsoleShell>
	);
}
