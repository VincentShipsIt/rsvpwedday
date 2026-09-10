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
 * The sticky top bar follows the home page's own blocks in order: an anchor for each section, and
 * a link to the target page wherever the couple placed a page teaser. That is what lets a separate
 * page sit between two sections in the bar, and it means the bar is ordered by dragging blocks
 * rather than by a second list that could disagree with the page.
 *
 * The footer then lists every other page as well, including any the home page does not tease.
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
	const navLinks = home ? pageAnchorLinks(home, site, dictionary, pages) : [];

	const pageLinks = pages
		.filter((page) => !isHomePage(page) && page.showInNav && visibleBlocks(page, site).length > 0)
		.map((page) => ({ href: pagePath(page.slug), label: pageLabel(page, dictionary) }));

	// A page the home page already teases is in `navLinks`, so the footer would otherwise name it
	// twice; the nav's copy wins, since it carries the teaser's own wording.
	const seen = new Set(navLinks.map((link) => link.href));
	const footerLinks = [...navLinks, ...pageLinks.filter((link) => !seen.has(link.href))];

	return { navLinks, footerLinks };
}
