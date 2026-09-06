"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateRsvpNote } from "@/app/admin/website/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";

type RsvpTranslationState = { locale: Locale; rsvpNote: string };

export type RsvpFormProps = {
	initialTranslations: RsvpTranslationState[];
};

export function RsvpForm({ initialTranslations }: RsvpFormProps) {
	const router = useRouter();
	const [translations, setTranslations] = useState(initialTranslations);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	function updateTranslation(locale: Locale, rsvpNote: string) {
		setTranslations((current) =>
			current.map((translation) =>
				translation.locale === locale ? { ...translation, rsvpNote } : translation
			)
		);
	}

	function handleSave() {
		setError(null);
		startTransition(async () => {
			const result = await updateRsvpNote({ translations });
			if (!result.ok) {
				setError(result.error);
				return;
			}
			toast.success("RSVP note saved");
			router.refresh();
		});
	}

	return (
		<div className="flex flex-col gap-8">
			<Card>
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
									placeholder="RSVP note"
									value={translation.rsvpNote}
									onChange={(event) => updateTranslation(translation.locale, event.target.value)}
								/>
							</TabsContent>
						))}
					</Tabs>
				</CardContent>
			</Card>

			{error && <p className="text-sm text-destructive">{error}</p>}

			<Button type="button" disabled={isPending} onClick={handleSave} className="self-start">
				Save RSVP note
			</Button>
		</div>
	);
}
