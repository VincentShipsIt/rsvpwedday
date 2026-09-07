import { StoryForm } from "@/app/admin/settings/milestones/milestones-form";
import { SettingsNav } from "@/app/admin/settings/settings-nav";
import { localeCodes } from "@/i18n/locales";
import { isBlobConfigured } from "@/lib/blob";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StoryPage() {
	const milestones = await db.storyMilestone.findMany({
		orderBy: { sortOrder: "asc" },
		include: { translations: true },
	});

	return (
		<div className="flex flex-col gap-6">
			<SettingsNav current="/admin/settings/milestones" />
			<h1 className="text-2xl font-medium">Milestones</h1>
			<StoryForm
				initialMilestones={milestones.map((milestone) => ({
					id: milestone.id,
					sortOrder: milestone.sortOrder,
					dateLabel: milestone.dateLabel,
					imageUrl: milestone.imageUrl ?? "",
					translations: localeCodes.map((code) => {
						const translation = milestone.translations.find(
							(candidate) => candidate.locale === code
						);
						return {
							locale: code,
							title: translation?.title ?? "",
							body: translation?.body ?? "",
						};
					}),
				}))}
				blobConfigured={isBlobConfigured()}
			/>
		</div>
	);
}
