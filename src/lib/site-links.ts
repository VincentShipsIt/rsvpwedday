import { isHomePage, pagePath } from "@/domain/blocks";
import type { Dictionary } from "@/i18n";
import {
	type PageView,
	pageAnchorLinks,
	pageLabel,
	type SiteData,
	visibleBlocks,
} from "@/lib/page-content";

export type SiteLink = { href: string; label: string };

/*
 * The public site's link lists, shared by the sticky nav, the mobile menu and the footer on every
 * page. Hrefs are absolute (`/#story`, not `#story`) so they work from any page; a block or page
 * with nothing in it never gets a link, so an empty section can't produce a dead anchor.
 *
 * The sticky top bar steps through the home page's own sections only — separate pages are reached
 * from the footer and from whatever page-teaser block the couple placed on the home page.
 */
export function buildSiteLinks({
	pages,
	site,
	dictionary,
}: {
	/** Every page, localized, in sort order. */
	pages: PageView[];
	site: SiteData;
	dictionary: Dictionary;
}): { navLinks: SiteLink[]; footerLinks: SiteLink[] } {
	const home = pages.find(isHomePage);
	const navLinks = home ? pageAnchorLinks(home, site, dictionary) : [];

	const pageLinks = pages
		.filter((page) => !isHomePage(page) && page.showInNav && visibleBlocks(page, site).length > 0)
		.map((page) => ({ href: pagePath(page.slug), label: pageLabel(page, dictionary) }));

	return { navLinks, footerLinks: [...navLinks, ...pageLinks] };
}
