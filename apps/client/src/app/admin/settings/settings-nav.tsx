import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import type { SettingsSectionHref } from "@/app/admin/settings/sections";
import { Button } from "@/components/ui/button";

// Back link for every `/admin/settings/<section>` page. The section links themselves live in the
// admin sidebar, which expands them whenever a settings page is open; `current` stays in the
// signature so each page still declares which section it is.
export function SettingsNav({ current: _current }: { current: SettingsSectionHref }) {
	return (
		<Button variant="link" className="h-auto w-fit p-0" asChild>
			<Link href="/admin/settings">
				<ChevronLeftIcon />
				Settings
			</Link>
		</Button>
	);
}
