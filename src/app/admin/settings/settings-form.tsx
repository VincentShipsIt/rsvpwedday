"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState, useTransition } from "react";
import { updateSettings } from "@/app/admin/settings/actions";
import { Button } from "@/components/button";
import { fieldClassName, Input } from "@/components/input";
import type { Locale } from "@/generated/prisma/client";
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

export type SettingsFormProps = {
	initialCoupleNames: string;
	initialRsvpDeadline: string;
	initialReplyTo: string;
	initialEvents: Omit<EventState, "key">[];
};

export function SettingsForm({
	initialCoupleNames,
	initialRsvpDeadline,
	initialReplyTo,
	initialEvents,
}: SettingsFormProps) {
	const [coupleNames, setCoupleNames] = useState(initialCoupleNames);
	const [rsvpDeadline, setRsvpDeadline] = useState(initialRsvpDeadline);
	const [replyTo, setReplyTo] = useState(initialReplyTo);
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

	function handleSubmit(formEvent: FormEvent) {
		formEvent.preventDefault();
		setError(null);

		const payload = {
			coupleNames,
			rsvpDeadline,
			replyTo,
			events: events.map(({ key, ...event }) => event),
		};

		startTransition(async () => {
			const result = await updateSettings(payload);
			if (!result.ok) {
				setError(result.error);
			}
		});
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-8">
			<fieldset className="flex flex-col gap-4 rounded-lg border border-ink/10 p-4">
				<legend className="px-1 font-medium">Wedding details</legend>
				<label htmlFor="coupleNames" className="flex flex-col gap-1 text-sm">
					Couple names
					<Input
						id="coupleNames"
						value={coupleNames}
						onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
							setCoupleNames(changeEvent.target.value)
						}
					/>
				</label>
				<label htmlFor="rsvpDeadline" className="flex flex-col gap-1 text-sm">
					RSVP deadline
					<Input
						id="rsvpDeadline"
						type="datetime-local"
						value={rsvpDeadline}
						onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
							setRsvpDeadline(changeEvent.target.value)
						}
					/>
				</label>
				<label htmlFor="replyTo" className="flex flex-col gap-1 text-sm">
					Reply-to contact
					<Input
						id="replyTo"
						value={replyTo}
						onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
							setReplyTo(changeEvent.target.value)
						}
					/>
				</label>
			</fieldset>

			<fieldset className="flex flex-col gap-6 rounded-lg border border-ink/10 p-4">
				<legend className="px-1 font-medium">Events</legend>
				{events.map((event) => (
					<div key={event.key} className="flex flex-col gap-3 rounded-md border border-ink/10 p-3">
						<div className="grid gap-2 sm:grid-cols-2">
							<Input
								placeholder="Slug"
								value={event.slug}
								onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
									updateEvent(event.key, { slug: changeEvent.target.value })
								}
							/>
							<Input
								type="number"
								placeholder="Sort order"
								value={event.sortOrder}
								onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
									updateEvent(event.key, { sortOrder: Number(changeEvent.target.value) })
								}
							/>
							<Input
								type="datetime-local"
								value={event.startsAt}
								onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
									updateEvent(event.key, { startsAt: changeEvent.target.value })
								}
							/>
							<Input
								type="datetime-local"
								value={event.endsAt}
								onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
									updateEvent(event.key, { endsAt: changeEvent.target.value })
								}
							/>
							<Input
								placeholder="Venue"
								value={event.venue}
								onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
									updateEvent(event.key, { venue: changeEvent.target.value })
								}
							/>
							<Input
								placeholder="Address"
								value={event.address}
								onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
									updateEvent(event.key, { address: changeEvent.target.value })
								}
							/>
							<Input
								placeholder="Maps URL"
								value={event.mapsUrl}
								onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
									updateEvent(event.key, { mapsUrl: changeEvent.target.value })
								}
							/>
							<Input
								placeholder="Dress code"
								value={event.dressCode}
								onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
									updateEvent(event.key, { dressCode: changeEvent.target.value })
								}
							/>
						</div>

						{event.translations.map((translation) => (
							<div key={translation.locale} className="grid gap-2 sm:grid-cols-2">
								<Input
									placeholder={`Name (${locales[translation.locale].label})`}
									value={translation.name}
									onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
										updateTranslation(event.key, translation.locale, {
											name: changeEvent.target.value,
										})
									}
								/>
								<textarea
									className={fieldClassName}
									placeholder={`Description (${locales[translation.locale].label})`}
									value={translation.description}
									onChange={(changeEvent: ChangeEvent<HTMLTextAreaElement>) =>
										updateTranslation(event.key, translation.locale, {
											description: changeEvent.target.value,
										})
									}
								/>
							</div>
						))}

						<Button type="button" variant="ghost" onClick={() => removeEvent(event.key)}>
							Remove event
						</Button>
					</div>
				))}
				<Button type="button" variant="secondary" onClick={addEvent}>
					Add event
				</Button>
			</fieldset>

			{error && <p className="text-sm text-red-700">{error}</p>}

			<Button type="submit" disabled={isPending}>
				Save settings
			</Button>
		</form>
	);
}
