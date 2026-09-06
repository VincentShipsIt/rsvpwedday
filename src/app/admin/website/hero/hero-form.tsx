"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateHero } from "@/app/admin/website/actions";
import { ImageField } from "@/components/admin/image-field";
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
};

export function HeroForm({
	initialHeroImageUrl,
	initialTranslations,
	blobConfigured,
}: HeroFormProps) {
	const router = useRouter();
	const [heroImageUrl, setHeroImageUrl] = useState(initialHeroImageUrl);
	const [translations, setTranslations] = useState(initialTranslations);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	function updateTranslation(locale: Locale, tagline: string) {
		setTranslations((current) =>
			current.map((translation) =>
				translation.locale === locale ? { ...translation, tagline } : translation
			)
		);
	}

	function handleSave() {
		setError(null);
		startTransition(async () => {
			const result = await updateHero({ heroImageUrl, translations });
			if (!result.ok) {
				setError(result.error);
				return;
			}
			toast.success("Hero saved");
			router.refresh();
		});
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

			{error && <p className="text-sm text-destructive">{error}</p>}

			<Button type="button" disabled={isPending} onClick={handleSave} className="self-start">
				Save hero
			</Button>
		</div>
	);
}
