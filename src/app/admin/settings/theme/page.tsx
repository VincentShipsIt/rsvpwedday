import { SettingsNav } from "@/app/admin/settings/settings-nav";
import { ThemeForm } from "@/app/admin/settings/theme/theme-form";
import { SiteTheme } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ThemePage() {
	const siteContent = await db.siteContent.findUnique({ where: { id: 1 } });

	return (
		<div className="flex flex-col gap-6">
			<SettingsNav current="/admin/settings/theme" />
			<h1 className="text-2xl font-medium">Theme</h1>
			<ThemeForm initialTheme={siteContent?.theme ?? SiteTheme.EDITORIAL} />
		</div>
	);
}
