export type SocialPost = {
	id: string;
	title: string;
	source: string;
	url: string;
	publishedAt?: string;
};

function decodeXml(value: string): string {
	return value
		.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

export async function fetchMaltaEngagements(): Promise<SocialPost[]> {
	const url =
		"https://news.google.com/rss/search?q=%22got+engaged%22+OR+%22announced+their+engagement%22+(Malta+OR+Gozo)+-Netflix+-Delta&hl=en-MT&gl=MT&ceid=MT:en";
	const response = await fetch(url, {
		headers: { "User-Agent": "SayYesConsole/1.0" },
		next: { revalidate: 1800 },
	});
	if (!response.ok) {
		throw new Error(`News feed ${response.status}`);
	}
	const xml = await response.text();
	const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 24);
	return items.map((match, index) => {
		const block = match[1] ?? "";
		const title = decodeXml(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "Untitled");
		const link = decodeXml(block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "");
		const source = decodeXml(
			block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? "Google News"
		);
		const publishedAt = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
		return {
			id: `${index}-${link.slice(-24)}`,
			title,
			source,
			url: link,
			publishedAt,
		};
	});
}
