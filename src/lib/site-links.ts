import type { Dictionary } from "@/i18n";

export type SiteLink = { href: string; label: string };

// The public site's link list, shared by the sticky nav, the mobile menu, and the footer on
// every public page. Hrefs are absolute (`/#story`, not `#story`) so they work from `/guide` too;
// each entry only appears once its content exists, so an empty section never gets a dead link.
export function buildSiteLinks({
	dictionary,
	guideTitle,
	hasStory,
	hasEvents,
	hasGuide,
	hasGallery,
	hasFaq,
}: {
	dictionary: Dictionary;
	/** The couple's own name for the guide page; falls back to the dictionary's generic label. */
	guideTitle: string;
	hasStory: boolean;
	hasEvents: boolean;
	hasGuide: boolean;
	hasGallery: boolean;
	hasFaq: boolean;
}): SiteLink[] {
	return [
		hasStory && { href: "/#story", label: dictionary.site.navStory },
		hasEvents && { href: "/#events", label: dictionary.site.navEvents },
		hasGuide && { href: "/guide", label: guideTitle || dictionary.site.navGuide },
		hasGallery && { href: "/#gallery", label: dictionary.site.navGallery },
		hasFaq && { href: "/#faq", label: dictionary.site.navFaq },
		{ href: "/#rsvp", label: dictionary.site.navRsvp },
	].filter((link): link is SiteLink => Boolean(link));
}

// The sticky top bar only steps through the home page's own sections; separate routes such as
// `/guide` are reached from the footer and the in-page teaser instead.
export function homeAnchorLinks(links: SiteLink[]): SiteLink[] {
	return links.filter((link) => link.href.startsWith("/#"));
}
