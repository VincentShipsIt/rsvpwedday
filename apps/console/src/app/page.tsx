import { AgentChat } from "@/components/agent-chat";
import { ConsoleShell } from "@/components/console-shell";
import { openRouterConfigured } from "@/lib/openrouter";

export default function AgentPage() {
	const configured = openRouterConfigured();
	return (
		<ConsoleShell pathname="/">
			<div className="flex flex-col gap-8">
				<div>
					<h1 className="font-display text-3xl font-semibold tracking-tight">Agent</h1>
					<p className="text-ink-soft mt-1 max-w-2xl font-serif text-sm">
						Talk to the CRM. It drafts leads, clients and providers; nothing is written until you
						confirm. Free OpenRouter models when a key is set.
					</p>
					<p className="mt-2 text-xs">
						{configured ? (
							<span>OpenRouter connected.</span>
						) : (
							<span className="text-saffron">
								No OPENROUTER_API_KEY — chat explains that; forms still save and geocode.
							</span>
						)}
					</p>
				</div>
				<AgentChat />
			</div>
		</ConsoleShell>
	);
}
