"use client";

import { useState } from "react";
import { updateRsvpNote } from "@/app/admin/website/actions";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
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
	const [translations, setTranslations] = useState(initialTranslations);

	const { status, error, retry } = useAutosave({
		value: translations,
		save: (nextTranslations) => updateRsvpNote({ translations: nextTranslations }),
	});

	function updateTranslation(locale: Locale, rsvpNote: string) {
		setTranslations((current) =>
			current.map((translation) =>
				translation.locale === locale ? { ...translation, rsvpNote } : translation
			)
		);
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

			<div className="flex items-center gap-3">
				<Button type="button" variant="secondary" disabled={status === "saving"} onClick={retry}>
					Save now
				</Button>
				<SaveStatus status={status} error={error} onRetry={retry} />
			</div>
		</div>
	);
}
