import { Button } from "@rsvpwedday/ui/button";
import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";

export default function NotFound() {
	return (
		<ConsoleShell active="/">
			<div className="flex flex-col gap-4">
				<h1 className="font-display text-3xl font-semibold tracking-tight">
					No request with that id
				</h1>
				<p>
					<Button variant="outline" asChild>
						<Link href="/">Back to requests</Link>
					</Button>
				</p>
			</div>
		</ConsoleShell>
	);
}
