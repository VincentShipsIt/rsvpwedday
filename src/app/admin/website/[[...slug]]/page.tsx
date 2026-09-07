import { redirect } from "next/navigation";

// The Website section was split up: page content moved to `/admin/pages`, the wedding's own data
// and the site's look and feel to `/admin/settings`, and the emails to their own page. Old
// bookmarks land on whichever of those now owns the thing they were editing.
const MOVED_TO: Record<string, string> = {
	"": "/admin/settings",
	theme: "/admin/settings/theme",
	effects: "/admin/settings/effects",
	events: "/admin/settings/events",
	story: "/admin/settings/milestones",
	emails: "/admin/emails",
	hero: "/admin/pages",
	gallery: "/admin/pages",
	faq: "/admin/pages",
	rsvp: "/admin/pages",
	guide: "/admin/pages",
};

export default async function MovedWebsitePage({
	params,
}: {
	params: Promise<{ slug?: string[] }>;
}) {
	const { slug } = await params;
	redirect(MOVED_TO[slug?.[0] ?? ""] ?? "/admin/settings");
}
