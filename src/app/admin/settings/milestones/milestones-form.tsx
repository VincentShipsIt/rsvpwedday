"use client";

import { useState } from "react";
import { updateStory } from "@/app/admin/settings/site-actions";
import { ImageField } from "@/components/admin/image-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Locale } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";

function createKey(): string {
	return crypto.randomUUID();
}

type MilestoneTranslationState = { locale: Locale; title: string; body: string };

type MilestoneState = {
	key: string;
	id?: string;
	sortOrder: number;
	dateLabel: string;
	imageUrl: string;
	translations: MilestoneTranslationState[];
};

function emptyMilestoneTranslations(): MilestoneTranslationState[] {
	return localeCodes.map((code) => ({ locale: code, title: "", body: "" }));
}

// Illustration prompts are written from the English copy: it is the source-of-truth locale
// (`en.ts` types the dictionary) and the only one guaranteed to be filled in.
function englishMilestoneCopy(milestone: MilestoneState): { title: string; body: string } {
	const english = milestone.translations.find((translation) => translation.locale === "en");
	return { title: english?.title ?? "", body: english?.body ?? "" };
}

export type StoryFormProps = {
	initialMilestones: Omit<MilestoneState, "key">[];
	blobConfigured: boolean;
	aiConfigured: boolean;
};

// The milestone timeline only. The section's heading and intro belong to the Story block on
// whichever page carries it, and are edited there.
export function StoryForm({ initialMilestones, blobConfigured, aiConfigured }: StoryFormProps) {
	const [milestones, setMilestones] = useState<MilestoneState[]>(() =>
		initialMilestones.map((milestone) => ({ ...milestone, key: milestone.id ?? createKey() }))
	);

	const { status, error, retry } = useAutosave({
		value: { milestones },
		save: ({ milestones: nextMilestones }) =>
			updateStory({ milestones: nextMilestones.map(({ key, ...milestone }) => milestone) }),
	});

	function addMilestone() {
		setMilestones((current) => {
			const nextSortOrder =
				current.length === 0 ? 0 : Math.max(...current.map((milestone) => milestone.sortOrder)) + 1;
			return [
				...current,
				{
					key: createKey(),
					sortOrder: nextSortOrder,
					dateLabel: "",
					imageUrl: "",
					translations: emptyMilestoneTranslations(),
				},
			];
		});
	}

	function removeMilestone(key: string) {
		setMilestones((current) => current.filter((milestone) => milestone.key !== key));
	}

	function updateMilestone(key: string, patch: Partial<MilestoneState>) {
		setMilestones((current) =>
			current.map((milestone) => (milestone.key === key ? { ...milestone, ...patch } : milestone))
		);
	}

	function updateMilestoneTranslation(
		key: string,
		locale: Locale,
		patch: Partial<MilestoneTranslationState>
	) {
		setMilestones((current) =>
			current.map((milestone) =>
				milestone.key === key
					? {
							...milestone,
							translations: milestone.translations.map((translation) =>
								translation.locale === locale ? { ...translation, ...patch } : translation
							),
						}
					: milestone
			)
		);
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4">
				<h2 className="text-lg font-medium">Milestones</h2>
				{milestones.map((milestone) => (
					<Card key={milestone.key}>
						<CardContent className="flex flex-col gap-4">
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="flex flex-col gap-1.5">
									<Label htmlFor={`${milestone.key}-date`}>Date label</Label>
									<Input
										id={`${milestone.key}-date`}
										placeholder="Summer 2019"
										value={milestone.dateLabel}
										onChange={(event) =>
											updateMilestone(milestone.key, { dateLabel: event.target.value })
										}
									/>
								</div>
								<div className="flex flex-col gap-1.5">
									<Label htmlFor={`${milestone.key}-order`}>Order</Label>
									<Input
										id={`${milestone.key}-order`}
										type="number"
										value={milestone.sortOrder}
										onChange={(event) =>
											updateMilestone(milestone.key, { sortOrder: Number(event.target.value) })
										}
									/>
								</div>
								<div className="sm:col-span-2">
									<ImageField
										label="Milestone image"
										value={milestone.imageUrl}
										onChange={(url) => updateMilestone(milestone.key, { imageUrl: url })}
										blobConfigured={blobConfigured}
										aiConfigured={aiConfigured}
										illustrate={{
											placement: "MILESTONE",
											dateLabel: milestone.dateLabel,
											...englishMilestoneCopy(milestone),
										}}
									/>
								</div>
							</div>

							<Tabs defaultValue={localeCodes[0]}>
								<TabsList>
									{localeCodes.map((code) => (
										<TabsTrigger key={code} value={code}>
											{locales[code].label}
										</TabsTrigger>
									))}
								</TabsList>
								{milestone.translations.map((translation) => (
									<TabsContent
										key={translation.locale}
										value={translation.locale}
										className="flex flex-col gap-2"
									>
										<Input
											placeholder="Title"
											value={translation.title}
											onChange={(event) =>
												updateMilestoneTranslation(milestone.key, translation.locale, {
													title: event.target.value,
												})
											}
										/>
										<RichTextEditor
											placeholder="Body"
											value={translation.body}
											onChange={(html) =>
												updateMilestoneTranslation(milestone.key, translation.locale, {
													body: html,
												})
											}
										/>
									</TabsContent>
								))}
							</Tabs>

							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="self-start"
								onClick={() => removeMilestone(milestone.key)}
							>
								Remove milestone
							</Button>
						</CardContent>
					</Card>
				))}
				<Button
					type="button"
					variant="secondary"
					size="sm"
					className="self-start"
					onClick={addMilestone}
				>
					Add milestone
				</Button>
			</div>

			<div className="flex items-center gap-3">
				<Button type="button" variant="secondary" disabled={status === "saving"} onClick={retry}>
					Save now
				</Button>
				<SaveStatus status={status} error={error} onRetry={retry} />
			</div>
		</div>
	);
}
