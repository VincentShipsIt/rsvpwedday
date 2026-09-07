import { HeroForm } from "@/app/admin/website/hero/hero-form";
import { WebsiteNav } from "@/app/admin/website/website-nav";
import { localeCodes } from "@/i18n/locales";
import { isBlobConfigured } from "@/lib/blob";
import { db } from "@/lib/db";
import { isImageGenerationConfigured } from "@/lib/replicate";

export const dynamic = "force-dynamic";

export default async function HeroPage() {
	const siteContent = await db.siteContent.findUnique({
		where: { id: 1 },
		include: { translations: true },
	});

	return (
		<div className="flex flex-col gap-6">
			<WebsiteNav current="/admin/website/hero" />
			<h1 className="text-2xl font-medium">Hero</h1>
			<HeroForm
				initialHeroImageUrl={siteContent?.heroImageUrl ?? ""}
				initialTranslations={localeCodes.map((code) => ({
					locale: code,
					tagline:
						siteContent?.translations.find((translation) => translation.locale === code)?.tagline ??
						"",
				}))}
				blobConfigured={isBlobConfigured()}
				aiConfigured={isImageGenerationConfigured()}
			/>
		</div>
	);
}
