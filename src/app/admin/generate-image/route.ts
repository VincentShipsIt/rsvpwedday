import { NextResponse } from "next/server";
import { z } from "zod";
import {
	buildIllustrationPrompt,
	ILLUSTRATION_PLACEMENTS,
	illustrationAspectRatio,
} from "@/domain/illustration-prompt";
import { SiteTheme } from "@/generated/prisma/enums";
import { copyImageToBlob, isBlobConfigured } from "@/lib/blob";
import { db } from "@/lib/db";
import { generateImage, isImageGenerationConfigured } from "@/lib/replicate";
import { requireAdmin } from "@/lib/require-admin";

// A prediction usually settles in a few seconds, but the model is a shared queue; this is the
// ceiling `src/lib/replicate.ts` works inside.
export const maxDuration = 60;

/*
 * The admin's "Generate illustration" buttons. The browser sends which block it is standing in,
 * that block's own copy, and whatever the couple typed in the generate box — the theme, the
 * couple's names and the venues come from the database here, so the *art direction* still cannot
 * be steered from the client even though the subject now can. `src/proxy.ts` already gates every
 * `/admin/*` path behind the session cookie.
 */
const requestSchema = z.object({
	placement: z.enum(ILLUSTRATION_PLACEMENTS),
	title: z.string().max(300).optional(),
	body: z.string().max(8000).optional(),
	dateLabel: z.string().max(200).optional(),
	/** The couple's own line about this one picture, typed in the generate box. */
	instructions: z.string().max(600).optional(),
});

function uniquePlaces(events: { venue: string; address: string | null }[]): string[] {
	const places = events.map((event) =>
		event.address ? `${event.venue}, ${event.address}` : event.venue
	);
	return [...new Set(places.filter((place) => place.trim() !== ""))];
}

export async function POST(request: Request): Promise<NextResponse> {
	try {
		await requireAdmin();
	} catch {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	if (!isImageGenerationConfigured()) {
		return NextResponse.json(
			{ error: "Image generation needs a Replicate token (REPLICATE_API_TOKEN)." },
			{ status: 503 }
		);
	}
	if (!isBlobConfigured()) {
		return NextResponse.json(
			{ error: "Generated images are stored in Blob — set BLOB_READ_WRITE_TOKEN." },
			{ status: 503 }
		);
	}

	const parsed = requestSchema.safeParse(await request.json());
	if (!parsed.success) {
		return NextResponse.json({ error: "Unknown block to illustrate." }, { status: 400 });
	}

	const [settings, siteContent, events] = await Promise.all([
		db.settings.findUnique({ where: { id: 1 } }),
		db.siteContent.findUnique({ where: { id: 1 } }),
		db.event.findMany({ orderBy: { sortOrder: "asc" }, select: { venue: true, address: true } }),
	]);

	const prompt = buildIllustrationPrompt(parsed.data, {
		theme: siteContent?.theme ?? SiteTheme.EDITORIAL,
		coupleNames: settings?.coupleNames ?? "the couple",
		places: uniquePlaces(events),
	});

	const generated = await generateImage({
		prompt,
		aspectRatio: illustrationAspectRatio(parsed.data.placement),
	});
	if (!generated.ok) {
		return NextResponse.json({ error: generated.error }, { status: 502 });
	}

	const stored = await copyImageToBlob(generated.url);
	if (!stored.ok) {
		return NextResponse.json({ error: stored.error }, { status: 502 });
	}

	return NextResponse.json({ url: stored.url });
}
