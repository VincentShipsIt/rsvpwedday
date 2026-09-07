import { EffectsForm } from "@/app/admin/settings/effects/effects-form";
import { SettingsNav } from "@/app/admin/settings/settings-nav";
import { clampEffectsSettings } from "@/domain/effects-settings";
import { OpeningAnimation } from "@/generated/prisma/enums";
import { isBlobConfigured } from "@/lib/blob";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EffectsPage() {
	const siteContent = await db.siteContent.findUnique({ where: { id: 1 } });

	return (
		<div className="flex flex-col gap-6">
			<SettingsNav current="/admin/settings/effects" />
			<h1 className="text-2xl font-medium">Effects</h1>
			<EffectsForm
				initialOpeningAnimation={siteContent?.openingAnimation ?? OpeningAnimation.BLOOM}
				initialParticlesEnabled={siteContent?.particlesEnabled ?? true}
				initialMusicUrl={siteContent?.musicUrl ?? ""}
				initialSettings={clampEffectsSettings(siteContent ?? {})}
				blobConfigured={isBlobConfigured()}
			/>
		</div>
	);
}
