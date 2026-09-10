import { Button } from "@rsvpwedday/ui/button";
import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";
import { InstagramPostCard } from "@/components/instagram-post-card";
import { fetchInstagramPosts, socialHashtags } from "@/lib/social";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SocialPage({
	searchParams,
}: {
	searchParams: Promise<{ tag?: string }>;
}) {
	const { tag: rawTag } = await searchParams;
	const tag = socialHashtags.find((name) => name === rawTag);
	let posts: Awaited<ReturnType<typeof fetchInstagramPosts>>["posts"] = [];
	let source: "instagram" | "search" | null = null;
	let error: string | null = null;
	try {
		const result = await fetchInstagramPosts(tag);
		posts = result.posts;
		source = result.source;
	} catch (caught) {
		error = caught instanceof Error ? caught.message : "Instagram feed failed";
	}

	return (
		<ConsoleShell pathname="/social">
			<div className="flex flex-col gap-8">
				<div>
					<h1 className="font-display text-3xl font-semibold tracking-tight">Social</h1>
					<p className="text-ink-soft mt-1 max-w-2xl font-serif text-sm">
						Instagram posts from Malta and Gozo weddings. Open one, then save the couple.
						{source === "instagram" ? " Live from your Instagram hashtags." : ""}
					</p>
				</div>
				<nav aria-label="Hashtags" className="flex flex-wrap gap-2">
					<Button variant={tag ? "outline" : "default"} size="sm" asChild>
						<Link href="/social">All</Link>
					</Button>
					{socialHashtags.map((name) => (
						<Button key={name} variant={tag === name ? "default" : "outline"} size="sm" asChild>
							<Link
								href={`/social?tag=${name}`}
								className={cn(tag === name && "pointer-events-none")}
							>
								#{name}
							</Link>
						</Button>
					))}
				</nav>
				{error ? <p className="text-saffron text-sm">{error}</p> : null}
				{!error && posts.length === 0 ? (
					<p className="text-ink-soft font-serif text-sm">
						No Instagram posts yet. Set META_PAGE_ACCESS_TOKEN to pull hashtag media from your
						studio account, or try another tag.
					</p>
				) : null}
				<ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{posts.map((post) => (
						<li key={post.id}>
							<InstagramPostCard post={post} />
						</li>
					))}
				</ul>
			</div>
		</ConsoleShell>
	);
}
