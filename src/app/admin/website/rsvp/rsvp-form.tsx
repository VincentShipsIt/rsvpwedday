"use client";

import { useState } from "react";
import { updateRsvpNote } from "@/app/admin/website/actions";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SaveStatus } from "@/components/admin/save-status";
import {
	SectionHeadingField,
	type SectionHeadingState,
} from "@/components/admin/section-heading-field";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Locale } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";

type RsvpTranslationState = { locale: Locale; rsvpNote: string };

export type RsvpFormProps = {
	initialHeadings: SectionHeadingState[];
	headingDefaults: Record<Locale, string>;
	initialTranslations: RsvpTranslationState[];
};

export function RsvpForm({ initialHeadings, headingDefaults, initialTranslations }: RsvpFormProps) {
	const [headings, setHeadings] = useState(initialHeadings);
	const [translations, setTranslations] = useState(initialTranslations);

	const { status, error, retry } = useAutosave({
		value: { headings, translations },
		save: ({ headings: nextHeadings, translations: nextTranslations }) =>
			updateRsvpNote({ headings: nextHeadings, translations: nextTranslations }),
	});

	function updateHeading(locale: Locale, heading: string) {
		setHeadings((current) =>
			current.map((entry) => (entry.locale === locale ? { ...entry, heading } : entry))
		);
	}

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
				<CardContent className="flex flex-col gap-4">
					<SectionHeadingField
						values={headings}
						defaults={headingDefaults}
						onChange={updateHeading}
					/>
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
								<RichTextEditor
									placeholder="RSVP note"
									value={translation.rsvpNote}
									onChange={(html) => updateTranslation(translation.locale, html)}
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
