"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSiteContent } from "@/app/admin/website/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { type Locale, SiteTheme } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";

const themeOptions: { value: SiteTheme; label: string }[] = [
	{ value: SiteTheme.EDITORIAL, label: "Editorial" },
	{ value: SiteTheme.MODERN, label: "Modern" },
	{ value: SiteTheme.GARDEN, label: "Garden" },
	{ value: SiteTheme.MIDNIGHT, label: "Midnight" },
	{ value: SiteTheme.BOHO, label: "Boho" },
];

function createKey(): string {
	return crypto.randomUUID();
}

function emptySiteTranslations(): SiteTranslationState[] {
	return localeCodes.map((code) => ({ locale: code, tagline: "", storyIntro: "", rsvpNote: "" }));
}

function emptyMilestoneTranslations(): MilestoneTranslationState[] {
	return localeCodes.map((code) => ({ locale: code, title: "", body: "" }));
}

type SiteTranslationState = {
	locale: Locale;
	tagline: string;
	storyIntro: string;
	rsvpNote: string;
};

type MilestoneTranslationState = { locale: Locale; title: string; body: string };

type MilestoneState = {
	key: string;
	id?: string;
	sortOrder: number;
	dateLabel: string;
	imageUrl: string;
	translations: MilestoneTranslationState[];
};

export type WebsiteFormProps = {
	initialHeroImageUrl: string;
	initialGalleryUrls: string;
	initialTheme: SiteTheme;
	initialTranslations: SiteTranslationState[];
	initialMilestones: Omit<MilestoneState, "key">[];
};

export function WebsiteForm({
	initialHeroImageUrl,
	initialGalleryUrls,
	initialTheme,
	initialTranslations,
	initialMilestones,
}: WebsiteFormProps) {
	const router = useRouter();
	const [heroImageUrl, setHeroImageUrl] = useState(initialHeroImageUrl);
	const [galleryUrls, setGalleryUrls] = useState(initialGalleryUrls);
	const [theme, setTheme] = useState<SiteTheme>(initialTheme);
	const [translations, setTranslations] = useState<SiteTranslationState[]>(
		initialTranslations.length > 0 ? initialTranslations : emptySiteTranslations()
	);
	const [milestones, setMilestones] = useState<MilestoneState[]>(() =>
		initialMilestones.map((milestone) => ({ ...milestone, key: createKey() }))
	);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	function updateSiteTranslation(locale: Locale, patch: Partial<SiteTranslationState>) {
		setTranslations((current) =>
			current.map((translation) =>
				translation.locale === locale ? { ...translation, ...patch } : translation
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

		const payload = {
			heroImageUrl,
			galleryUrls: galleryUrls
				.split("\n")
				.map((url) => url.trim())
				.filter((url) => url.length > 0),
			theme,
			translations,
			milestones: milestones.map(({ key, ...milestone }) => milestone),
		};

		startTransition(async () => {
			const result = await updateSiteContent(payload);
			if (!result.ok) {
				setError(result.error);
				return;
			}
			toast.success("Website saved");
			router.refresh();
		});
	}

	return (
		<div className="flex flex-col gap-8">
			<Card>
				<CardHeader>
					<CardTitle>Hero &amp; gallery</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="theme">Theme</Label>
						<Select value={theme} onValueChange={(value) => setTheme(value as SiteTheme)}>
							<SelectTrigger id="theme" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{themeOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="heroImageUrl">Hero image URL</Label>
						<Input
							id="heroImageUrl"
							value={heroImageUrl}
							onChange={(event) => setHeroImageUrl(event.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="galleryUrls">Gallery image URLs (one per line)</Label>
						<Textarea
							id="galleryUrls"
							rows={6}
							value={galleryUrls}
							onChange={(event) => setGalleryUrls(event.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Copy</CardTitle>
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
							<TabsContent
								key={translation.locale}
								value={translation.locale}
								className="flex flex-col gap-2"
							>
								<Input
									placeholder="Tagline"
									value={translation.tagline}
									onChange={(event) =>
										updateSiteTranslation(translation.locale, { tagline: event.target.value })
									}
								/>
								<Textarea
									placeholder="Story intro"
									value={translation.storyIntro}
									onChange={(event) =>
										updateSiteTranslation(translation.locale, { storyIntro: event.target.value })
									}
								/>
								<Textarea
									placeholder="RSVP note"
									value={translation.rsvpNote}
									onChange={(event) =>
										updateSiteTranslation(translation.locale, { rsvpNote: event.target.value })
									}
								/>
							</TabsContent>
						))}
					</Tabs>
				</CardContent>
			</Card>

			<div className="flex flex-col gap-4">
				<h2 className="text-lg font-medium">Our story milestones</h2>
				{milestones.map((milestone) => (
					<Card key={milestone.key}>
						<CardContent className="flex flex-col gap-4">
							<div className="grid gap-2 sm:grid-cols-2">
								<Input
									placeholder="Date label"
									value={milestone.dateLabel}
									onChange={(event) =>
										updateMilestone(milestone.key, { dateLabel: event.target.value })
									}
								/>
								<Input
									type="number"
									placeholder="Sort order"
									value={milestone.sortOrder}
									onChange={(event) =>
										updateMilestone(milestone.key, { sortOrder: Number(event.target.value) })
									}
								/>
								<Input
									placeholder="Image URL"
									className="sm:col-span-2"
									value={milestone.imageUrl}
									onChange={(event) =>
										updateMilestone(milestone.key, { imageUrl: event.target.value })
									}
								/>
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
				Save website
			</Button>
		</div>
	);
}
