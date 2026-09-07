import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const SECTIONS = [
	{ href: "/admin/website/hero", label: "Hero" },
	{ href: "/admin/website/story", label: "Story" },
	{ href: "/admin/website/events", label: "Events" },
	{ href: "/admin/website/gallery", label: "Gallery" },
	{ href: "/admin/website/rsvp", label: "RSVP" },
	{ href: "/admin/website/theme", label: "Theme" },
	{ href: "/admin/website/effects", label: "Effects" },
] as const;

// Shared sub-nav and breadcrumb for every `/admin/website/<section>` page, so each page can stay
// focused on its own fields while still linking to the rest of the site editor.
export function WebsiteNav({ current }: { current: (typeof SECTIONS)[number]["href"] }) {
	return (
		<div className="flex flex-col gap-3">
			<Button variant="link" className="h-auto w-fit p-0" asChild>
				<Link href="/admin/website">
					<ChevronLeftIcon />
					Website
				</Link>
			</Button>
			<nav className="flex flex-wrap gap-2">
				{SECTIONS.map((section) => (
					<Button
						key={section.href}
						variant={section.href === current ? "secondary" : "ghost"}
						size="sm"
						asChild
					>
						<Link href={section.href}>{section.label}</Link>
					</Button>
				))}
			</nav>
		</div>
	);
}
