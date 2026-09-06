import { ImageResponse } from "next/og";
import { Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Wedding RSVP";

// The card is drawn from live settings, so it must be rendered per request. Without this Next
// prerenders it during `next build`, where CI has no `DATABASE_URL` and the env parse throws.
export const dynamic = "force-dynamic";

const DEFAULT_COUPLE_NAMES = "Our Wedding";
const DEFAULT_TAGLINE = "We're getting married and can't wait to celebrate with you.";

// Google's CSS2 endpoint serves whichever font format matches the requesting `User-Agent`; this
// one predates woff2 support, so it comes back with a `truetype` `src`, which Satori (the engine
// behind `ImageResponse`) can actually embed. Modern UAs would get woff2 instead, which Satori
// does not support.
const LEGACY_USER_AGENT =
	"Mozilla/5.0 (Windows NT 5.1) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.56 Safari/535.11";

async function loadCormorantFont(): Promise<ArrayBuffer | null> {
	try {
		const cssResponse = await fetch(
			"https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&display=swap",
			{ headers: { "User-Agent": LEGACY_USER_AGENT } }
		);
		if (!cssResponse.ok) {
			return null;
		}
		const css = await cssResponse.text();
		const fontUrl = css.match(/src: url\((.+?)\) format\('truetype'\)/)?.[1];
		if (!fontUrl) {
			return null;
		}
		const fontResponse = await fetch(fontUrl);
		if (!fontResponse.ok) {
			return null;
		}
		return await fontResponse.arrayBuffer();
	} catch {
		return null;
	}
}

export default async function OpengraphImage() {
	const [settings, siteContent, firstEvent, cormorantFont] = await Promise.all([
		db.settings.findUnique({ where: { id: 1 } }),
		db.siteContent.findUnique({ where: { id: 1 }, include: { translations: true } }),
		db.event.findFirst({ orderBy: { sortOrder: "asc" } }),
		loadCormorantFont(),
	]);

	const coupleNames = settings?.coupleNames || DEFAULT_COUPLE_NAMES;
	const tagline =
		siteContent?.translations.find((translation) => translation.locale === Locale.en)?.tagline ||
		DEFAULT_TAGLINE;
	const eventDate = firstEvent
		? new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(firstEvent.startsAt)
		: null;

	const displayFontFamily = cormorantFont ? "Cormorant Garamond" : "Georgia, serif";

	return new ImageResponse(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: 24,
				backgroundColor: "#f8f0d7",
				padding: 80,
				textAlign: "center",
			}}
		>
			<div
				style={{
					fontFamily: displayFontFamily,
					fontSize: 96,
					fontWeight: 600,
					color: "#38492f",
				}}
			>
				{coupleNames}
			</div>
			{eventDate && (
				<div
					style={{
						fontSize: 28,
						letterSpacing: 4,
						textTransform: "uppercase",
						color: "#8a9a72",
					}}
				>
					{eventDate}
				</div>
			)}
			<div style={{ fontSize: 30, color: "#4a3826", maxWidth: 900 }}>{tagline}</div>
		</div>,
		{
			...size,
			fonts: cormorantFont
				? [{ name: "Cormorant Garamond", data: cormorantFont, weight: 600, style: "normal" }]
				: undefined,
		}
	);
}
