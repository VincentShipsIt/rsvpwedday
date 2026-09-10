import { ConsoleShell } from "@/components/console-shell";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
	return (
		<ConsoleShell active="/">
			<h1 className="font-display text-4xl tracking-tight">No request with that id</h1>
			<p className="mt-4">
				<ButtonLink href="/" variant="outline">
					Back to requests
				</ButtonLink>
			</p>
		</ConsoleShell>
	);
}
