"use client";

import { useState } from "react";
import { updateFaq } from "@/app/admin/website/actions";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";

function createKey(): string {
	return crypto.randomUUID();
}

type EntryTranslationState = { locale: Locale; question: string; answer: string };

type EntryState = {
	key: string;
	id?: string;
	sortOrder: number;
	translations: EntryTranslationState[];
};

function emptyEntryTranslations(): EntryTranslationState[] {
	return localeCodes.map((code) => ({ locale: code, question: "", answer: "" }));
}

export type FaqFormProps = {
	initialEntries: Omit<EntryState, "key">[];
};

export function FaqForm({ initialEntries }: FaqFormProps) {
	const [entries, setEntries] = useState<EntryState[]>(() =>
		initialEntries.map((entry) => ({ ...entry, key: createKey() }))
	);

	const { status, error, retry } = useAutosave({
		value: { entries },
		save: ({ entries: nextEntries }) =>
			updateFaq({ entries: nextEntries.map(({ key, ...entry }) => entry) }),
	});

	function addEntry() {
		setEntries((current) => {
			const nextSortOrder =
				current.length === 0 ? 0 : Math.max(...current.map((entry) => entry.sortOrder)) + 1;
			return [
				...current,
				{ key: createKey(), sortOrder: nextSortOrder, translations: emptyEntryTranslations() },
			];
		});
	}

	function removeEntry(key: string) {
		setEntries((current) => current.filter((entry) => entry.key !== key));
	}

	function updateEntry(key: string, patch: Partial<EntryState>) {
		setEntries((current) =>
			current.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry))
		);
	}

	function updateEntryTranslation(
		key: string,
		locale: Locale,
		patch: Partial<EntryTranslationState>
	) {
		setEntries((current) =>
			current.map((entry) =>
				entry.key === key
					? {
							...entry,
							translations: entry.translations.map((translation) =>
								translation.locale === locale ? { ...translation, ...patch } : translation
							),
						}
					: entry
			)
		);
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4">
				{entries.map((entry) => (
					<Card key={entry.key}>
						<CardContent className="flex flex-col gap-4">
							<div className="flex flex-col gap-1.5 sm:w-40">
								<Label htmlFor={`${entry.key}-order`}>Order</Label>
								<Input
									id={`${entry.key}-order`}
									type="number"
									value={entry.sortOrder}
									onChange={(event) =>
										updateEntry(entry.key, { sortOrder: Number(event.target.value) })
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
								{entry.translations.map((translation) => (
									<TabsContent
										key={translation.locale}
										value={translation.locale}
										className="flex flex-col gap-2"
									>
										<Input
											placeholder="Question"
											value={translation.question}
											onChange={(event) =>
												updateEntryTranslation(entry.key, translation.locale, {
													question: event.target.value,
												})
											}
										/>
										<Textarea
											placeholder="Answer"
											value={translation.answer}
											onChange={(event) =>
												updateEntryTranslation(entry.key, translation.locale, {
													answer: event.target.value,
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
								onClick={() => removeEntry(entry.key)}
							>
								Remove question
							</Button>
						</CardContent>
					</Card>
				))}
				<Button
					type="button"
					variant="secondary"
					size="sm"
					className="self-start"
					onClick={addEntry}
				>
					Add question
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
