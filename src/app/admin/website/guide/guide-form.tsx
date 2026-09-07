"use client";

import { useState } from "react";
import { updateGuide } from "@/app/admin/website/actions";
import { ImageField } from "@/components/admin/image-field";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
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

type GuideIntroTranslationState = { locale: Locale; guideTitle: string; guideIntro: string };
type SectionTranslationState = { locale: Locale; title: string; intro: string };
type ItemTranslationState = { locale: Locale; title: string; body: string };

type ItemState = {
	key: string;
	id?: string;
	sortOrder: number;
	url: string;
	imageUrl: string;
	translations: ItemTranslationState[];
};

type SectionState = {
	key: string;
	id?: string;
	slug: string;
	sortOrder: number;
	imageUrl: string;
	translations: SectionTranslationState[];
	items: ItemState[];
};

function nextSortOrder(list: { sortOrder: number }[]): number {
	return list.length === 0 ? 0 : Math.max(...list.map((entry) => entry.sortOrder)) + 1;
}

function emptySectionTranslations(): SectionTranslationState[] {
	return localeCodes.map((code) => ({ locale: code, title: "", intro: "" }));
}

function emptyItemTranslations(): ItemTranslationState[] {
	return localeCodes.map((code) => ({ locale: code, title: "", body: "" }));
}

export type GuideFormProps = {
	initialTranslations: GuideIntroTranslationState[];
	initialSections: (Omit<SectionState, "key" | "items"> & { items: Omit<ItemState, "key">[] })[];
	blobConfigured: boolean;
};

export function GuideForm({
	initialTranslations,
	initialSections,
	blobConfigured,
}: GuideFormProps) {
	const [translations, setTranslations] = useState(initialTranslations);
	const [sections, setSections] = useState<SectionState[]>(() =>
		initialSections.map((section) => ({
			...section,
			key: createKey(),
			items: section.items.map((item) => ({ ...item, key: createKey() })),
		}))
	);

	const { status, error, retry } = useAutosave({
		value: { translations, sections },
		save: ({ translations: nextTranslations, sections: nextSections }) =>
			updateGuide({
				translations: nextTranslations,
				sections: nextSections.map(({ key, items, ...section }) => ({
					...section,
					items: items.map(({ key: itemKey, ...item }) => item),
				})),
			}),
	});

	function updateTranslation(locale: Locale, patch: Partial<GuideIntroTranslationState>) {
		setTranslations((current) =>
			current.map((translation) =>
				translation.locale === locale ? { ...translation, ...patch } : translation
			)
		);
	}

	function addSection() {
		setSections((current) => [
			...current,
			{
				key: createKey(),
				slug: "",
				sortOrder: nextSortOrder(current),
				imageUrl: "",
				translations: emptySectionTranslations(),
				items: [],
			},
		]);
	}

	function removeSection(key: string) {
		setSections((current) => current.filter((section) => section.key !== key));
	}

	function updateSection(key: string, patch: Partial<SectionState>) {
		setSections((current) =>
			current.map((section) => (section.key === key ? { ...section, ...patch } : section))
		);
	}

	function updateSectionTranslation(
		key: string,
		locale: Locale,
		patch: Partial<SectionTranslationState>
	) {
		setSections((current) =>
			current.map((section) =>
				section.key === key
					? {
							...section,
							translations: section.translations.map((translation) =>
								translation.locale === locale ? { ...translation, ...patch } : translation
							),
						}
					: section
			)
		);
	}

	function addItem(sectionKey: string) {
		setSections((current) =>
			current.map((section) =>
				section.key === sectionKey
					? {
							...section,
							items: [
								...section.items,
								{
									key: createKey(),
									sortOrder: nextSortOrder(section.items),
									url: "",
									imageUrl: "",
									translations: emptyItemTranslations(),
								},
							],
						}
					: section
			)
		);
	}

	function removeItem(sectionKey: string, itemKey: string) {
		setSections((current) =>
			current.map((section) =>
				section.key === sectionKey
					? { ...section, items: section.items.filter((item) => item.key !== itemKey) }
					: section
			)
		);
	}

	function updateItem(sectionKey: string, itemKey: string, patch: Partial<ItemState>) {
		setSections((current) =>
			current.map((section) =>
				section.key === sectionKey
					? {
							...section,
							items: section.items.map((item) =>
								item.key === itemKey ? { ...item, ...patch } : item
							),
						}
					: section
			)
		);
	}

	function updateItemTranslation(
		sectionKey: string,
		itemKey: string,
		locale: Locale,
		patch: Partial<ItemTranslationState>
	) {
		setSections((current) =>
			current.map((section) =>
				section.key === sectionKey
					? {
							...section,
							items: section.items.map((item) =>
								item.key === itemKey
									? {
											...item,
											translations: item.translations.map((translation) =>
												translation.locale === locale ? { ...translation, ...patch } : translation
											),
										}
									: item
							),
						}
					: section
			)
		);
	}

	return (
		<div className="flex flex-col gap-8">
			<Card>
				<CardHeader>
					<CardTitle>Page title and intro</CardTitle>
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
									placeholder="Page title, also the nav label (e.g. Discover Malta)"
									value={translation.guideTitle}
									onChange={(event) =>
										updateTranslation(translation.locale, { guideTitle: event.target.value })
									}
								/>
								<Textarea
									placeholder="Intro shown under the title and in the home-page teaser"
									value={translation.guideIntro}
									onChange={(event) =>
										updateTranslation(translation.locale, { guideIntro: event.target.value })
									}
								/>
							</TabsContent>
						))}
					</Tabs>
				</CardContent>
			</Card>

			<div className="flex flex-col gap-4">
				<h2 className="text-lg font-medium">Sections</h2>
				{sections.map((section) => (
					<Card key={section.key}>
						<CardContent className="flex flex-col gap-4">
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="flex flex-col gap-1.5">
									<Label htmlFor={`${section.key}-slug`}>Anchor</Label>
									<Input
										id={`${section.key}-slug`}
										placeholder="where-to-stay (blank: taken from the English title)"
										value={section.slug}
										onChange={(event) => updateSection(section.key, { slug: event.target.value })}
									/>
								</div>
								<div className="flex flex-col gap-1.5">
									<Label htmlFor={`${section.key}-order`}>Order</Label>
									<Input
										id={`${section.key}-order`}
										type="number"
										value={section.sortOrder}
										onChange={(event) =>
											updateSection(section.key, { sortOrder: Number(event.target.value) })
										}
									/>
								</div>
								<div className="sm:col-span-2">
									<ImageField
										label="Section image"
										value={section.imageUrl}
										onChange={(url) => updateSection(section.key, { imageUrl: url })}
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
								{section.translations.map((translation) => (
									<TabsContent
										key={translation.locale}
										value={translation.locale}
										className="flex flex-col gap-2"
									>
										<Input
											placeholder="Section title"
											value={translation.title}
											onChange={(event) =>
												updateSectionTranslation(section.key, translation.locale, {
													title: event.target.value,
												})
											}
										/>
										<Textarea
											placeholder="Section intro"
											value={translation.intro}
											onChange={(event) =>
												updateSectionTranslation(section.key, translation.locale, {
													intro: event.target.value,
												})
											}
										/>
									</TabsContent>
								))}
							</Tabs>

							<div className="flex flex-col gap-3 border-l-2 border-muted pl-4">
								<h3 className="text-sm font-medium">Items</h3>
								{section.items.map((item) => (
									<Card key={item.key} className="bg-muted/30">
										<CardContent className="flex flex-col gap-3">
											<div className="grid gap-3 sm:grid-cols-2">
												<div className="flex flex-col gap-1.5">
													<Label htmlFor={`${item.key}-url`}>Link</Label>
													<Input
														id={`${item.key}-url`}
														type="url"
														placeholder="https://"
														value={item.url}
														onChange={(event) =>
															updateItem(section.key, item.key, { url: event.target.value })
														}
													/>
												</div>
												<div className="flex flex-col gap-1.5">
													<Label htmlFor={`${item.key}-order`}>Order</Label>
													<Input
														id={`${item.key}-order`}
														type="number"
														value={item.sortOrder}
														onChange={(event) =>
															updateItem(section.key, item.key, {
																sortOrder: Number(event.target.value),
															})
														}
													/>
												</div>
												<div className="sm:col-span-2">
													<ImageField
														label="Item image"
														value={item.imageUrl}
														onChange={(url) => updateItem(section.key, item.key, { imageUrl: url })}
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
												{item.translations.map((translation) => (
													<TabsContent
														key={translation.locale}
														value={translation.locale}
														className="flex flex-col gap-2"
													>
														<Input
															placeholder="Title (a hotel, an airline, a beach)"
															value={translation.title}
															onChange={(event) =>
																updateItemTranslation(section.key, item.key, translation.locale, {
																	title: event.target.value,
																})
															}
														/>
														<Textarea
															placeholder="Body"
															value={translation.body}
															onChange={(event) =>
																updateItemTranslation(section.key, item.key, translation.locale, {
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
												onClick={() => removeItem(section.key, item.key)}
											>
												Remove item
											</Button>
										</CardContent>
									</Card>
								))}
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="self-start"
									onClick={() => addItem(section.key)}
								>
									Add item
								</Button>
							</div>

							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="self-start"
								onClick={() => removeSection(section.key)}
							>
								Remove section
							</Button>
						</CardContent>
					</Card>
				))}
				<Button
					type="button"
					variant="secondary"
					size="sm"
					className="self-start"
					onClick={addSection}
				>
					Add section
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
