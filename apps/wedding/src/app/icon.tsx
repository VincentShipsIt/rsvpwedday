import { ImageResponse } from "next/og";
import { Locale } from "@/generated/prisma/enums";
import { getHomeHero } from "@/lib/home-hero";

// Same reason as the root layout's `generateMetadata`: the picture comes from the database at
// request time, so `next build` must never try to render this icon statically (CI has no database).
export const dynamic = "force-dynamic";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/*
 * The browser-tab icon, cropped square out of the hero photo the couple uploaded, so the site's
 * tab looks like the site. With no hero set yet it falls back to a plain ring on the theme's
 * cream ground — deliberately text-free, since a generated icon that needs a font is one more
 * thing that can fail on a cold serverless boot.
 */
export default async function Icon() {
	// The hero lives on the home page's hero block, so this reads it the same way the OG card and
	// the emails do rather than reaching for the retired `SiteContent.heroImageUrl`.
	const { imageUrl: heroImageUrl } = await getHomeHero(Locale.en);

	return new ImageResponse(
		heroImageUrl ? (
			<div style={{ display: "flex", width: "100%", height: "100%" }}>
				{/* biome-ignore lint/performance/noImgElement: Satori renders plain elements, not next/image. */}
				<img
					src={heroImageUrl}
					alt=""
					width={size.width}
					height={size.height}
					style={{ width: "100%", height: "100%", objectFit: "cover" }}
				/>
			</div>
		) : (
			<div
				style={{
					display: "flex",
					width: "100%",
					height: "100%",
					alignItems: "center",
					justifyContent: "center",
					background: "#faf7f0",
				}}
			>
				<div
					style={{
						width: 34,
						height: 34,
						borderRadius: "50%",
						border: "6px solid #2f4d3a",
					}}
				/>
			</div>
		),
		{
			...size,
			// Favicons are requested constantly; without this every tab would re-fetch the hero photo
			// through the image renderer.
			headers: { "cache-control": "public, max-age=3600, stale-while-revalidate=86400" },
		}
	);
}
