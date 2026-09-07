import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SitePage, type SitePageParams } from "@/components/site/site-page";
import { HOME_PAGE_SLUG, isReservedSlug } from "@/domain/blocks";
import { getDictionary } from "@/i18n";
import { db } from "@/lib/db";
import { localizePage, pageInclude, pageLabel } from "@/lib/page-content";
import { resolveSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

type PageProps = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<SitePageParams>;
};

// Every page the couple adds in `/admin/pages` is served here. The home page keeps the root
// route (`src/app/page.tsx`), so its slug is not reachable as `/home`.
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
	const [{ slug }, { lang }] = await Promise.all([params, searchParams]);
	const locale = await resolveSiteLocale(lang);
	const [settings, record] = await Promise.all([
		db.settings.findUnique({ where: { id: 1 } }),
		db.page.findUnique({ where: { slug }, include: pageInclude }),
	]);
	if (!record) {
		return {};
	}
	const title = pageLabel(localizePage(record, locale), getDictionary(locale));
	return { title: settings ? `${title} — ${settings.coupleNames}` : title };
}

export default async function DynamicSitePage({ params, searchParams }: PageProps) {
	const { slug } = await params;
	if (slug === HOME_PAGE_SLUG || isReservedSlug(slug)) {
		notFound();
	}
	return <SitePage slug={slug} params={await searchParams} />;
}
