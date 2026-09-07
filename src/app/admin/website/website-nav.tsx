import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import type { WebsiteSectionHref } from "@/app/admin/website/sections";
import { Button } from "@/components/ui/button";

// Back link for every `/admin/website/<section>` page. The section links themselves live in the
// admin sidebar (`AdminSidebar`), which expands them whenever a website page is open; `current`
// stays in the signature so each page still declares which section it is.
export function WebsiteNav({ current: _current }: { current: WebsiteSectionHref }) {
	return (
		<Button variant="link" className="h-auto w-fit p-0" asChild>
			<Link href="/admin/website">
				<ChevronLeftIcon />
				Website
			</Link>
		</Button>
	);
}
