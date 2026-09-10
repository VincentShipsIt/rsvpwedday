import { ConsoleShell } from "@/components/console-shell";
import { fetchMaltaEngagements } from "@/lib/social";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
	let posts: Awaited<ReturnType<typeof fetchMaltaEngagements>> = [];
	let error: string | null = null;
	try {
		posts = await fetchMaltaEngagements();
	} catch (caught) {
		error = caught instanceof Error ? caught.message : "Feed failed";
	}

	return (
		<ConsoleShell pathname="/social">
			<div className="flex flex-col gap-8">
				<div>
					<h1 className="font-display text-3xl font-semibold tracking-tight">Social</h1>
					<p className="text-ink-soft mt-1 max-w-2xl font-serif text-sm">
						Public mentions of engagements and weddings in Malta and Gozo. This is a news search,
						not an Instagram scrape — we do not log into anyone’s account.
					</p>
				</div>
				{error ? <p className="text-saffron text-sm">{error}</p> : null}
				<ul className="divide-y divide-ink/10 rounded-xl bg-card ring-1 ring-foreground/10">
					{posts.map((post) => (
						<li key={post.id} className="px-4 py-3">
							<a
								href={post.url}
								target="_blank"
								rel="noreferrer"
								className="font-medium hover:text-saffron"
							>
								{post.title}
							</a>
							<p className="text-ink-soft mt-1 font-serif text-xs">
								{post.source}
								{post.publishedAt ? ` · ${post.publishedAt}` : ""}
							</p>
						</li>
					))}
				</ul>
			</div>
		</ConsoleShell>
	);
}
