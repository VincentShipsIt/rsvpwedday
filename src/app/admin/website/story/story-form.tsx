"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateStory } from "@/app/admin/website/actions";
import { ImageField } from "@/components/admin/image-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";

function createKey(): string {
	return crypto.randomUUID();
}

type StoryIntroTranslationState = { locale: Locale; storyIntro: string };
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

export type StoryFormProps = {
	initialTranslations: StoryIntroTranslationState[];
	initialMilestones: Omit<MilestoneState, "key">[];
	blobConfigured: boolean;
};

export function StoryForm({
	initialTranslations,
	initialMilestones,
	blobConfigured,
}: StoryFormProps) {
	const router = useRouter();
	const [translations, setTranslations] = useState(initialTranslations);
	const [milestones, setMilestones] = useState<MilestoneState[]>(() =>
		initialMilestones.map((milestone) => ({ ...milestone, key: createKey() }))
	);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	function updateTranslation(locale: Locale, storyIntro: string) {
		setTranslations((current) =>
			current.map((translation) =>
				translation.locale === locale ? { ...translation, storyIntro } : translation
			)
		);
	}

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

	function handleSave() {
		setError(null);
		startTransition(async () => {
			const result = await updateStory({
				translations,
				milestones: milestones.map(({ key, ...milestone }) => milestone),
			});
			if (!result.ok) {
				setError(result.error);
				return;
			}
			toast.success("Story saved");
			router.refresh();
		});
	}

	return (
		<div className="flex flex-col gap-8">
			<Card>
				<CardHeader>
					<CardTitle>Story intro</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue={localeCodes[0]}>
						<TabsList>
							{localeCodes.map((code) => (
								<TabsTrigger key={code} value={code}>
									{locales[code].label}
								</TabsTrigger>
							))}
						</TabsList>
						{translations.map((translation) => (
							<TabsContent key={translation.locale} value={translation.locale}>
								<Textarea
									placeholder="Story intro"
									value={translation.storyIntro}
									onChange={(event) => updateTranslation(translation.locale, event.target.value)}
								/>
							</TabsContent>
						))}
					</Tabs>
				</CardContent>
			</Card>

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
										<Textarea
											placeholder="Body"
											value={translation.body}
											onChange={(event) =>
												updateMilestoneTranslation(milestone.key, translation.locale, {
													body: event.target.value,
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

			{error && <p className="text-sm text-destructive">{error}</p>}

			<Button type="button" disabled={isPending} onClick={handleSave} className="self-start">
				Save story
			</Button>
		</div>
	);
}
