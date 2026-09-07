"use client";

import { useState } from "react";
import { updateHero } from "@/app/admin/website/actions";
import { ImageField } from "@/components/admin/image-field";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Locale } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";

type HeroTranslationState = { locale: Locale; tagline: string };

export type HeroFormProps = {
	initialHeroImageUrl: string;
	initialTranslations: HeroTranslationState[];
	blobConfigured: boolean;
	aiConfigured: boolean;
};

export function HeroForm({
	initialHeroImageUrl,
	initialTranslations,
	blobConfigured,
	aiConfigured,
}: HeroFormProps) {
	const [heroImageUrl, setHeroImageUrl] = useState(initialHeroImageUrl);
	const [translations, setTranslations] = useState(initialTranslations);

	const { status, error, retry } = useAutosave({
		value: { heroImageUrl, translations },
		save: updateHero,
	});

	function updateTranslation(locale: Locale, tagline: string) {
		setTranslations((current) =>
			current.map((translation) =>
				translation.locale === locale ? { ...translation, tagline } : translation
			)
		);
	}

	return (
		<div className="flex flex-col gap-8">
			<Card>
				<CardHeader>
					<CardTitle>Hero photo</CardTitle>
				</CardHeader>
				<CardContent>
					<ImageField
						label="Hero image"
						value={heroImageUrl}
						onChange={setHeroImageUrl}
						blobConfigured={blobConfigured}
						aiConfigured={aiConfigured}
						illustrate={{
							placement: "hero",
							title: translations.find((translation) => translation.locale === "en")?.tagline,
						}}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Tagline</CardTitle>
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
								<Input
									placeholder="Tagline"
									value={translation.tagline}
									onChange={(event) => updateTranslation(translation.locale, event.target.value)}
								/>
							</TabsContent>
						))}
					</Tabs>
				</CardContent>
			</Card>

			<div className="flex items-center gap-3">
				<Button type="button" variant="secondary" disabled={status === "saving"} onClick={retry}>
					Save now
				</Button>
				<SaveStatus status={status} error={error} onRetry={retry} />
			</div>
		</div>
	);
}
