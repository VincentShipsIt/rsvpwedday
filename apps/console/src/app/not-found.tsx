import { Button } from "@rsvpwedday/ui/button";
import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";

export default function NotFound() {
	return (
		<ConsoleShell active="/">
			<h1 className="font-display text-4xl tracking-tight">No request with that id</h1>
			<p className="mt-4">
				<Button variant="outline" asChild>
					<Link href="/">Back to requests</Link>
				</Button>
			</p>
		</ConsoleShell>
	);
}
