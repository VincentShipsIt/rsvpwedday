import { EffectsForm } from "@/app/admin/website/effects/effects-form";
import { WebsiteNav } from "@/app/admin/website/website-nav";
import { OpeningAnimation } from "@/generated/prisma/enums";
import { isBlobConfigured } from "@/lib/blob";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EffectsPage() {
	const siteContent = await db.siteContent.findUnique({ where: { id: 1 } });

	return (
		<div className="flex flex-col gap-6">
			<WebsiteNav current="/admin/website/effects" />
			<h1 className="text-2xl font-medium">Effects</h1>
			<EffectsForm
				initialOpeningAnimation={siteContent?.openingAnimation ?? OpeningAnimation.SEAL}
				initialParticlesEnabled={siteContent?.particlesEnabled ?? true}
				initialMusicUrl={siteContent?.musicUrl ?? ""}
				blobConfigured={isBlobConfigured()}
			/>
		</div>
	);
}
