"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateEvents } from "@/app/admin/website/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";

function createKey(): string {
	return crypto.randomUUID();
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
	initialEvents: Omit<EventState, "key">[];
};

export function EventsForm({ initialEvents }: EventsFormProps) {
	const router = useRouter();
	const [events, setEvents] = useState<EventState[]>(() =>
		initialEvents.map((event) => ({ ...event, key: createKey() }))
	);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

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

	function handleSave() {
		setError(null);
		startTransition(async () => {
			const result = await updateEvents({ events: events.map(({ key, ...event }) => event) });
			if (!result.ok) {
				setError(result.error);
				return;
			}
			toast.success("Events saved");
			router.refresh();
		});
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
								<Input
									type="datetime-local"
									value={event.startsAt}
									onChange={(changeEvent) =>
										updateEvent(event.key, { startsAt: changeEvent.target.value })
									}
								/>
								<Input
									type="datetime-local"
									value={event.endsAt}
									onChange={(changeEvent) =>
										updateEvent(event.key, { endsAt: changeEvent.target.value })
									}
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
										<Textarea
											placeholder="Description"
											value={translation.description}
											onChange={(changeEvent) =>
												updateTranslation(event.key, translation.locale, {
													description: changeEvent.target.value,
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

			{error && <p className="text-sm text-destructive">{error}</p>}

			<Button type="button" disabled={isPending} onClick={handleSave} className="self-start">
				Save events
			</Button>
		</div>
	);
}
