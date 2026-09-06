"use client";

import type { ChangeEvent, SubmitEvent } from "react";
import { useState, useTransition } from "react";
import { updateSiteContent } from "@/app/admin/website/actions";
import { Button } from "@/components/button";
import { fieldClassName, Input } from "@/components/input";
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

	function handleSubmit(formEvent: SubmitEvent) {
		formEvent.preventDefault();
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
			}
		});
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-8">
			<fieldset className="flex flex-col gap-4 rounded-lg border border-ink/10 p-4">
				<legend className="px-1 font-medium">Hero &amp; gallery</legend>
				<label htmlFor="theme" className="flex flex-col gap-1 text-sm">
					Theme
					<select
						id="theme"
						className={fieldClassName}
						value={theme}
						onChange={(changeEvent: ChangeEvent<HTMLSelectElement>) =>
							setTheme(changeEvent.target.value as SiteTheme)
						}
					>
						{themeOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>
				<label htmlFor="heroImageUrl" className="flex flex-col gap-1 text-sm">
					Hero image URL
					<Input
						id="heroImageUrl"
						value={heroImageUrl}
						onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
							setHeroImageUrl(changeEvent.target.value)
						}
					/>
				</label>
				<label htmlFor="galleryUrls" className="flex flex-col gap-1 text-sm">
					Gallery image URLs (one per line)
					<textarea
						id="galleryUrls"
						className={fieldClassName}
						rows={6}
						value={galleryUrls}
						onChange={(changeEvent: ChangeEvent<HTMLTextAreaElement>) =>
							setGalleryUrls(changeEvent.target.value)
						}
					/>
				</label>
			</fieldset>

			<fieldset className="flex flex-col gap-6 rounded-lg border border-ink/10 p-4">
				<legend className="px-1 font-medium">Copy</legend>
				{translations.map((translation) => (
					<div
						key={translation.locale}
						className="flex flex-col gap-2 rounded-md border border-ink/10 p-3"
					>
						<p className="text-xs font-medium uppercase tracking-wide text-ink/50">
							{locales[translation.locale].label}
						</p>
						<Input
							placeholder="Tagline"
							value={translation.tagline}
							onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
								updateSiteTranslation(translation.locale, { tagline: changeEvent.target.value })
							}
						/>
						<textarea
							className={fieldClassName}
							placeholder="Story intro"
							value={translation.storyIntro}
							onChange={(changeEvent: ChangeEvent<HTMLTextAreaElement>) =>
								updateSiteTranslation(translation.locale, { storyIntro: changeEvent.target.value })
							}
						/>
						<textarea
							className={fieldClassName}
							placeholder="RSVP note"
							value={translation.rsvpNote}
							onChange={(changeEvent: ChangeEvent<HTMLTextAreaElement>) =>
								updateSiteTranslation(translation.locale, { rsvpNote: changeEvent.target.value })
							}
						/>
					</div>
				))}
			</fieldset>

			<fieldset className="flex flex-col gap-6 rounded-lg border border-ink/10 p-4">
				<legend className="px-1 font-medium">Our story milestones</legend>
				{milestones.map((milestone) => (
					<div
						key={milestone.key}
						className="flex flex-col gap-3 rounded-md border border-ink/10 p-3"
					>
						<div className="grid gap-2 sm:grid-cols-2">
							<Input
								placeholder="Date label"
								value={milestone.dateLabel}
								onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
									updateMilestone(milestone.key, { dateLabel: changeEvent.target.value })
								}
							/>
							<Input
								type="number"
								placeholder="Sort order"
								value={milestone.sortOrder}
								onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
									updateMilestone(milestone.key, { sortOrder: Number(changeEvent.target.value) })
								}
							/>
							<Input
								placeholder="Image URL"
								className="sm:col-span-2"
								value={milestone.imageUrl}
								onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
									updateMilestone(milestone.key, { imageUrl: changeEvent.target.value })
								}
							/>
						</div>

						{milestone.translations.map((translation) => (
							<div key={translation.locale} className="grid gap-2 sm:grid-cols-2">
								<Input
									placeholder={`Title (${locales[translation.locale].label})`}
									value={translation.title}
									onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
										updateMilestoneTranslation(milestone.key, translation.locale, {
											title: changeEvent.target.value,
										})
									}
								/>
								<textarea
									className={fieldClassName}
									placeholder={`Body (${locales[translation.locale].label})`}
									value={translation.body}
									onChange={(changeEvent: ChangeEvent<HTMLTextAreaElement>) =>
										updateMilestoneTranslation(milestone.key, translation.locale, {
											body: changeEvent.target.value,
										})
									}
								/>
							</div>
						))}

						<Button type="button" variant="ghost" onClick={() => removeMilestone(milestone.key)}>
							Remove milestone
						</Button>
					</div>
				))}
				<Button type="button" variant="secondary" onClick={addMilestone}>
					Add milestone
				</Button>
			</fieldset>

			{error && <p className="text-sm text-red-700">{error}</p>}

			<Button type="submit" disabled={isPending}>
				Save website
			</Button>
		</form>
	);
}
