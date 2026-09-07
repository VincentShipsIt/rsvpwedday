"use client";

import { useState } from "react";
import { updateEvents } from "@/app/admin/settings/site-actions";
import { DateTimeField } from "@/components/admin/date-time-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dayOffset, describeDayOffset } from "@/domain/wedding-date";
import type { Locale } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";
import { parseWireDate } from "@/lib/wire-date";

function createKey(): string {
	return crypto.randomUUID();
}

/*
 * Where this event sits against the wedding day, written under its start date. A raw timestamp
 * hides a mistyped month or year; "364 days before" does not.
 */
function relativeToWedding(startsAt: string, weddingDate: string): string | undefined {
	const start = parseWireDate(startsAt);
	const wedding = parseWireDate(weddingDate);
	if (!start || !wedding) {
		return undefined;
	}
	return describeDayOffset(dayOffset(start, wedding));
}

function emptyTranslations(): TranslationState[] {
	return localeCodes.map((code) => ({ locale: code, name: "", description: "" }));
}

type TranslationState = { locale: Locale; name: string; description: string };

type EventState = {
	key: string;
	id?: string;
	slug: string;
	startsAt: string;
	endsAt: string;
	venue: string;
	address: string;
	mapsUrl: string;
	dressCode: string;
	sortOrder: number;
	translations: TranslationState[];
};

export type EventsFormProps = {
	/** The wedding day, so each event can say where it falls relative to it. */
	weddingDate: string;
	initialEvents: Omit<EventState, "key">[];
};

export function EventsForm({ weddingDate, initialEvents }: EventsFormProps) {
	const [events, setEvents] = useState<EventState[]>(() =>
		initialEvents.map((event) => ({ ...event, key: event.id ?? createKey() }))
	);

	const { status, error, retry } = useAutosave({
		value: { events },
		save: ({ events: nextEvents }) =>
			updateEvents({
				events: nextEvents.map(({ key, ...event }) => event),
			}),
	});

	function addEvent() {
		setEvents((current) => [
			...current,
			{
				key: createKey(),
				slug: "",
				startsAt: "",
				endsAt: "",
				venue: "",
				address: "",
				mapsUrl: "",
				dressCode: "",
				sortOrder: current.length,
				translations: emptyTranslations(),
			},
		]);
	}

	function removeEvent(key: string) {
		setEvents((current) => current.filter((event) => event.key !== key));
	}

	function updateEvent(key: string, patch: Partial<EventState>) {
		setEvents((current) =>
			current.map((event) => (event.key === key ? { ...event, ...patch } : event))
		);
	}

	function updateTranslation(key: string, locale: Locale, patch: Partial<TranslationState>) {
		setEvents((current) =>
			current.map((event) =>
				event.key === key
					? {
							...event,
							translations: event.translations.map((translation) =>
								translation.locale === locale ? { ...translation, ...patch } : translation
							),
						}
					: event
			)
		);
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4">
				{events.map((event) => (
					<Card key={event.key}>
						<CardContent className="flex flex-col gap-4">
							<div className="grid gap-2 sm:grid-cols-2">
								<Input
									placeholder="Slug"
									value={event.slug}
									onChange={(changeEvent) =>
										updateEvent(event.key, { slug: changeEvent.target.value })
									}
								/>
								<Input
									type="number"
									placeholder="Sort order"
									value={event.sortOrder}
									onChange={(changeEvent) =>
										updateEvent(event.key, { sortOrder: Number(changeEvent.target.value) })
									}
								/>
								<DateTimeField
									label="Starts"
									value={event.startsAt}
									onChange={(value) => updateEvent(event.key, { startsAt: value })}
									description={relativeToWedding(event.startsAt, weddingDate)}
								/>
								<DateTimeField
									label="Ends"
									value={event.endsAt}
									onChange={(value) => updateEvent(event.key, { endsAt: value })}
									clearable
								/>
								<Input
									placeholder="Venue"
									value={event.venue}
									onChange={(changeEvent) =>
										updateEvent(event.key, { venue: changeEvent.target.value })
									}
								/>
								<Input
									placeholder="Address"
									value={event.address}
									onChange={(changeEvent) =>
										updateEvent(event.key, { address: changeEvent.target.value })
									}
								/>
								<Input
									placeholder="Maps URL"
									value={event.mapsUrl}
									onChange={(changeEvent) =>
										updateEvent(event.key, { mapsUrl: changeEvent.target.value })
									}
								/>
								<Input
									placeholder="Dress code"
									value={event.dressCode}
									onChange={(changeEvent) =>
										updateEvent(event.key, { dressCode: changeEvent.target.value })
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
								{event.translations.map((translation) => (
									<TabsContent
										key={translation.locale}
										value={translation.locale}
										className="flex flex-col gap-2"
									>
										<Input
											placeholder="Name"
											value={translation.name}
											onChange={(changeEvent) =>
												updateTranslation(event.key, translation.locale, {
													name: changeEvent.target.value,
												})
											}
										/>
										<RichTextEditor
											placeholder="Description"
											value={translation.description}
											onChange={(html) =>
												updateTranslation(event.key, translation.locale, {
													description: html,
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
								onClick={() => removeEvent(event.key)}
							>
								Remove event
							</Button>
						</CardContent>
					</Card>
				))}
				<Button
					type="button"
					variant="secondary"
					size="sm"
					className="self-start"
					onClick={addEvent}
				>
					Add event
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
