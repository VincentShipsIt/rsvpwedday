import { Button } from "@rsvpwedday/ui/button";
import Image from "next/image";
import type { InstagramPost } from "@/lib/social";

function formatPosted(value?: string): string | undefined {
	if (!value) return undefined;
	const date = new Date(value);
	if (!Number.isNaN(date.getTime())) {
		return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
	}
	return value;
}

export function InstagramPostCard({ post }: { post: InstagramPost }) {
	const when = formatPosted(post.postedAt);
	const who = post.username
		? /\s/.test(post.username)
			? post.username
			: `@${post.username}`
		: null;
	const meta = [who, when, post.likes != null ? `${post.likes} likes` : null]
		.filter(Boolean)
		.join(" · ");

	return (
		<article className="flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
			{post.mediaUrl ? (
				<a
					href={post.permalink}
					target="_blank"
					rel="noreferrer"
					className="relative aspect-square bg-accent"
				>
					<Image
						src={post.mediaUrl}
						alt={post.caption ? post.caption.slice(0, 120) : "Instagram post"}
						fill
						unoptimized
						className="object-cover"
						sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
					/>
				</a>
			) : (
				<iframe
					title={who ? `Instagram post by ${who}` : "Instagram post"}
					src={post.embedUrl}
					className="aspect-[4/5] w-full border-0 bg-accent"
					loading="lazy"
					allow="encrypted-media; picture-in-picture"
				/>
			)}
			<div className="flex flex-1 flex-col gap-2 p-3">
				{post.mediaUrl && meta ? <p className="text-muted-foreground text-xs">{meta}</p> : null}
				{post.caption ? <p className="line-clamp-3 text-sm leading-snug">{post.caption}</p> : null}
				<Button variant="outline" size="sm" className="mt-auto w-fit" asChild>
					<a href={post.permalink} target="_blank" rel="noreferrer">
						Open on Instagram
					</a>
				</Button>
			</div>
		</article>
	);
}
