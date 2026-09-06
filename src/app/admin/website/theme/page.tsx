import { ThemeForm } from "@/app/admin/website/theme/theme-form";
import { WebsiteNav } from "@/app/admin/website/website-nav";
import { SiteTheme } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ThemePage() {
	const siteContent = await db.siteContent.findUnique({ where: { id: 1 } });

	return (
		<div className="flex flex-col gap-6">
			<WebsiteNav current="/admin/website/theme" />
			<h1 className="text-2xl font-medium">Theme</h1>
			<ThemeForm initialTheme={siteContent?.theme ?? SiteTheme.EDITORIAL} />
		</div>
	);
}
