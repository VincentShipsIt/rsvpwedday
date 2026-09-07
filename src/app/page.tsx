import type { Metadata } from "next";
import { SitePage, type SitePageParams } from "@/components/site/site-page";
import { HOME_PAGE_SLUG } from "@/domain/blocks";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
	const settings = await db.settings.findUnique({ where: { id: 1 } });
	return settings ? { title: `${settings.coupleNames} — Wedding RSVP` } : {};
}

export default async function LandingPage({
	searchParams,
}: {
	searchParams: Promise<SitePageParams>;
}) {
	return <SitePage slug={HOME_PAGE_SLUG} params={await searchParams} />;
}
