export type InstagramPost = {
	id: string;
	shortcode: string;
	kind: "p" | "reel";
	permalink: string;
	embedUrl: string;
	username?: string;
	caption?: string;
	likes?: number;
	postedAt?: string;
	mediaUrl?: string;
	mediaType?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
};

export const socialHashtags = [
	"maltawedding",
	"gozowedding",
	"maltaengagement",
	"weddinginmalta",
	"destinationweddingmalta",
] as const;

const GRAPH = "https://graph.facebook.com/v21.0";
const DROP =
	/dove cameron|måneskin|maneskin|barstool|netflix|conversion therapy|camila mendes|romeo and juliet/i;

type GraphMedia = {
	id: string;
	caption?: string;
	media_type?: InstagramPost["mediaType"];
	media_url?: string;
	permalink?: string;
	timestamp?: string;
	like_count?: number;
	children?: { data?: Array<{ media_url?: string; media_type?: string }> };
};

function decodeHtml(value: string): string {
	return value
		.replace(/<[^>]+>/g, " ")
		.replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
			String.fromCodePoint(Number.parseInt(hex, 16))
		)
		.replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function fromPermalink(
	url: string
): Pick<InstagramPost, "id" | "shortcode" | "kind" | "permalink" | "embedUrl"> | null {
	const match = url.match(/instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/i);
	if (!match?.[1] || !match[2]) return null;
	const kind = match[1].toLowerCase() === "reel" ? "reel" : "p";
	const shortcode = match[2];
	const permalink = `https://www.instagram.com/${kind}/${shortcode}/`;
	return {
		id: shortcode,
		shortcode,
		kind,
		permalink,
		embedUrl: `${permalink}embed/`,
	};
}

function seedPost(shortcode: string, caption: string, username?: string): InstagramPost {
	const base = fromPermalink(`https://www.instagram.com/p/${shortcode}/`);
	if (!base) {
		return {
			id: shortcode,
			shortcode,
			kind: "p",
			permalink: `https://www.instagram.com/p/${shortcode}/`,
			embedUrl: `https://www.instagram.com/p/${shortcode}/embed/`,
			caption,
			username,
		};
	}
	return { ...base, caption, username };
}

const seedPosts: InstagramPost[] = [
	seedPost(
		"Ctls6fpowPS",
		"Li-Ana & Antonio's intimate wedding shoot in Gozo.",
		"Wedding Story Malta"
	),
	seedPost(
		"C7RtrptIQtF",
		"Juliana & Siddarth. A wedding planned from far, a dream in Malta.",
		"Perfect Weddings Malta"
	),
	seedPost("DaQgwE1iKnx", "Civil wedding on the water. 01.07.26 · @heracruisesmalta001", undefined),
	seedPost("C8E5iM4td8-", "A dinner setup at a Malta wedding.", "Perfect Weddings Malta"),
	seedPost(
		"DVyv2GRjWVr",
		"Historic garden wedding at Villa Bologna.",
		"Historic Garden Weddings in Malta"
	),
	seedPost(
		"CkrH9F_sLpy",
		"Here's to love, laughter, and happily ever after.",
		"Wedding Story Malta"
	),
	seedPost("Bj2WnaLgWVG", "#wedding #bride #gozo #malta #justmarried", undefined),
	seedPost(
		"DVbaLm7jWXu",
		"Planning a destination wedding? Here's why Malta should be on the list.",
		undefined
	),
	seedPost("DYZ93f4NME4", "Weddings on repeat. #band #wedding #malta", undefined),
	seedPost(
		"DXD9OGIic6t",
		"It's often the smallest details that shape how a wedding feels.",
		undefined
	),
	seedPost("DTvZgF5iD0W", "Malta wedding photo.", "Malta Wedding Photo"),
	seedPost("CtcHeTHIgPS", "Wedding DJ set with singer @gianlucabezzina.", undefined),
	seedPost("DZLKGWqOHwO", "#maltaviolin #weddings #violinist #malta #mdina", undefined),
	seedPost("DDUteVdOPYy", "That's a wrap for weddings in 2024.", undefined),
	seedPost("DWoi_ZNjYxU", "Planning a wedding? Corinthia Caterers Weddings.", undefined),
];

function matchesTag(post: InstagramPost, tag?: string): boolean {
	if (!tag) return true;
	const hay = `${post.caption ?? ""} ${post.username ?? ""}`.toLowerCase();
	if (hay.includes(tag.toLowerCase())) return true;
	if (tag.includes("gozo")) return hay.includes("gozo");
	if (tag.includes("engagement")) return hay.includes("engag");
	if (tag.includes("destination")) return hay.includes("destination") || hay.includes("malta");
	if (tag.includes("malta")) return hay.includes("malta");
	return false;
}

function isWeddingPost(post: InstagramPost): boolean {
	const hay = `${post.caption ?? ""} ${post.username ?? ""}`;
	if (DROP.test(hay)) return false;
	if (!post.caption || post.caption.toLowerCase() === "instagram") return false;
	return /(wedding|weddings|engaged|engagement|bride|groom|maltawedding|gozowedding)/i.test(hay);
}

function parseBrave(html: string): InstagramPost[] {
	const parts = html.split('data-type="web"');
	const posts: InstagramPost[] = [];
	for (const part of parts) {
		const href = part.match(/https:\/\/www\.instagram\.com\/(?:p|reel)\/[A-Za-z0-9_-]+/i)?.[0];
		if (!href) continue;
		const base = fromPermalink(href);
		if (!base) continue;
		const title = decodeHtml(
			part.match(/search-snippet-title[^>]*title="([^"]+)"/)?.[1] ??
				part.match(/search-snippet-title[^>]*>([\s\S]*?)<\/(?:div|span)>/)?.[1] ??
				""
		);
		const [head, ...rest] = title.split("|").map((piece) => piece.trim());
		const caption = rest.join(" | ") || title || undefined;
		const username =
			head && head !== caption && !head.toLowerCase().includes("instagram") ? head : undefined;
		posts.push({ ...base, username, caption });
	}
	return posts;
}

function uniquePosts(posts: InstagramPost[]): InstagramPost[] {
	const seen = new Set<string>();
	const out: InstagramPost[] = [];
	for (const post of posts) {
		if (seen.has(post.shortcode)) continue;
		seen.add(post.shortcode);
		out.push(post);
	}
	return out;
}

const searchCache = new Map<string, { at: number; posts: InstagramPost[] }>();
const searchTtlMs = 30 * 60 * 1000;

async function searchQuery(query: string): Promise<InstagramPost[]> {
	const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
	const response = await fetch(url, {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
			Accept: "text/html",
			"Accept-Language": "en-US,en;q=0.9",
		},
		cache: "no-store",
	});
	if (!response.ok) throw new Error(`Instagram search ${response.status}`);
	return parseBrave(await response.text());
}

async function searchInstagram(tag?: string): Promise<InstagramPost[]> {
	const key = tag ?? "all";
	const cached = searchCache.get(key);
	if (cached && Date.now() - cached.at < searchTtlMs) return cached.posts;

	const query = tag
		? `site:instagram.com ${tag}`
		: 'site:instagram.com (maltawedding OR gozowedding OR "malta wedding")';

	try {
		const posts = uniquePosts(await searchQuery(query))
			.filter((post) =>
				tag ? post.caption && post.caption.toLowerCase() !== "instagram" : isWeddingPost(post)
			)
			.slice(0, 18);
		if (posts.length === 0) return seedPosts.filter((post) => matchesTag(post, tag));
		searchCache.set(key, { at: Date.now(), posts });
		return posts;
	} catch {
		if (cached) return cached.posts;
		const seeded = seedPosts.filter((post) => matchesTag(post, tag));
		return seeded.length > 0 ? seeded : seedPosts;
	}
}

async function graphInstagramUserId(token: string): Promise<string | null> {
	const configured = process.env.INSTAGRAM_BUSINESS_ID?.trim();
	if (configured) return configured;
	const response = await fetch(
		`${GRAPH}/me?fields=instagram_business_account&access_token=${encodeURIComponent(token)}`,
		{ next: { revalidate: 3600 } }
	);
	if (!response.ok) return null;
	const body = (await response.json()) as { instagram_business_account?: { id?: string } };
	return body.instagram_business_account?.id ?? null;
}

function fromGraph(media: GraphMedia): InstagramPost | null {
	if (!media.permalink) return null;
	const base = fromPermalink(media.permalink);
	if (!base) return null;
	const child = media.children?.data?.find((item) => item.media_url);
	return {
		...base,
		caption: media.caption,
		likes: media.like_count,
		postedAt: media.timestamp,
		mediaUrl: media.media_url ?? child?.media_url,
		mediaType: media.media_type,
	};
}

async function fetchGraphHashtag(
	tag: string,
	userId: string,
	token: string
): Promise<InstagramPost[]> {
	const search = await fetch(
		`${GRAPH}/ig_hashtag_search?user_id=${encodeURIComponent(userId)}&q=${encodeURIComponent(tag)}&access_token=${encodeURIComponent(token)}`,
		{ next: { revalidate: 1800 } }
	);
	if (!search.ok) return [];
	const found = (await search.json()) as { data?: Array<{ id?: string }> };
	const hashtagId = found.data?.[0]?.id;
	if (!hashtagId) return [];
	const fields =
		"id,caption,media_type,media_url,permalink,timestamp,like_count,children{media_url,media_type}";
	const media = await fetch(
		`${GRAPH}/${hashtagId}/recent_media?user_id=${encodeURIComponent(userId)}&fields=${fields}&limit=12&access_token=${encodeURIComponent(token)}`,
		{ next: { revalidate: 1800 } }
	);
	if (!media.ok) return [];
	const body = (await media.json()) as { data?: GraphMedia[] };
	return (body.data ?? []).map(fromGraph).filter((post): post is InstagramPost => post !== null);
}

async function fetchGraphPosts(tag?: string): Promise<InstagramPost[] | null> {
	const token = process.env.META_PAGE_ACCESS_TOKEN?.trim();
	if (!token) return null;
	const userId = await graphInstagramUserId(token);
	if (!userId) return null;
	const tags = tag ? [tag] : [...socialHashtags];
	const batches = await Promise.allSettled(
		tags.map((name) => fetchGraphHashtag(name, userId, token))
	);
	const posts = uniquePosts(
		batches.flatMap((result) => (result.status === "fulfilled" ? result.value : []))
	);
	return posts.length > 0 ? posts.slice(0, 18) : [];
}

export async function fetchInstagramPosts(
	tag?: string
): Promise<{ posts: InstagramPost[]; source: "instagram" | "search" }> {
	const graph = await fetchGraphPosts(tag);
	if (graph && graph.length > 0) return { posts: graph, source: "instagram" };
	const posts = await searchInstagram(tag);
	if (posts.length > 0) return { posts, source: "search" };
	return { posts: seedPosts.filter((post) => matchesTag(post, tag)), source: "search" };
}
