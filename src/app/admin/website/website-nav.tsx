import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { WEBSITE_SECTIONS, type WebsiteSectionHref } from "@/app/admin/website/sections";
import { Button } from "@/components/ui/button";

// Shared sub-nav and breadcrumb for every `/admin/website/<section>` page, so each page can stay
// focused on its own fields while still linking to the rest of the site editor.
export function WebsiteNav({ current }: { current: WebsiteSectionHref }) {
	return (
		<div className="flex flex-col gap-3">
			<Button variant="link" className="h-auto w-fit p-0" asChild>
				<Link href="/admin/website">
					<ChevronLeftIcon />
					Website
				</Link>
			</Button>
			<nav className="flex flex-wrap gap-2">
				{WEBSITE_SECTIONS.map((section) => (
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
