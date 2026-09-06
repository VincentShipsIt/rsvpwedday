"use client";

import type { ChangeEvent, SubmitEvent } from "react";
import { useState, useTransition } from "react";
import { submitRsvp } from "@/app/rsvp/[token]/actions";
import { Button } from "@/components/button";
import { fieldClassName, Input } from "@/components/input";
import { GuestKind } from "@/generated/prisma/enums";
import type { Dictionary } from "@/i18n";
import { t } from "@/i18n";

type FormGuest = {
	id: string;
	firstName: string;
	lastName: string;
	dietary: string;
	attendance: Record<string, boolean>;
};

type FormCompanion = {
	key: string;
	firstName: string;
	lastName: string;
	kind: GuestKind;
	email: string;
	phone: string;
};

export type RsvpFormProps = {
	token: string;
	dictionary: Dictionary;
	companionAllowance: number;
	guests: {
		id: string;
		firstName: string;
		lastName: string;
		dietary: string;
		attendance: { eventId: string; attending: boolean }[];
	}[];
	companions: {
		firstName: string;
		lastName: string;
		kind: GuestKind;
		email: string;
		phone: string;
	}[];
	events: { id: string; name: string }[];
	initialNote: string;
	initialSongRequest: string;
};

function createCompanionKey(): string {
	return crypto.randomUUID();
}

export function RsvpForm({
	token,
	dictionary,
	companionAllowance,
	guests: initialGuests,
	companions: initialCompanions,
	events,
	initialNote,
	initialSongRequest,
}: RsvpFormProps) {
	const [guests, setGuests] = useState<FormGuest[]>(() =>
		initialGuests.map((guest) => ({
			id: guest.id,
			firstName: guest.firstName,
			lastName: guest.lastName,
			dietary: guest.dietary,
			attendance: Object.fromEntries(
				guest.attendance.map((attendance) => [attendance.eventId, attendance.attending])
			),
		}))
	);
	const [companions, setCompanions] = useState<FormCompanion[]>(() =>
		initialCompanions.map((companion) => ({ ...companion, key: createCompanionKey() }))
	);
	const [note, setNote] = useState(initialNote);
	const [songRequest, setSongRequest] = useState(initialSongRequest);
	const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
	const [isPending, startTransition] = useTransition();

	function updateAttendance(guestId: string, eventId: string, attending: boolean) {
		setGuests((current) =>
			current.map((guest) =>
				guest.id === guestId
					? { ...guest, attendance: { ...guest.attendance, [eventId]: attending } }
					: guest
			)
		);
	}

	function updateDietary(guestId: string, dietary: string) {
		setGuests((current) =>
			current.map((guest) => (guest.id === guestId ? { ...guest, dietary } : guest))
		);
	}

	function addCompanion() {
		setCompanions((current) => [
			...current,
			{
				key: createCompanionKey(),
				firstName: "",
				lastName: "",
				kind: GuestKind.ADULT,
				email: "",
				phone: "",
			},
		]);
	}

	function removeCompanion(key: string) {
		setCompanions((current) => current.filter((companion) => companion.key !== key));
	}

	function updateCompanion(key: string, patch: Partial<FormCompanion>) {
		setCompanions((current) =>
			current.map((companion) => (companion.key === key ? { ...companion, ...patch } : companion))
		);
	}

	function handleSubmit(formEvent: SubmitEvent) {
		formEvent.preventDefault();

		const payload = {
			guests: guests.map((guest) => ({
				guestId: guest.id,
				dietary: guest.dietary,
				attendance: events.map((event) => ({
					eventId: event.id,
					attending: guest.attendance[event.id] ?? false,
				})),
			})),
			companions: companions.map((companion) => ({
				firstName: companion.firstName,
				lastName: companion.lastName,
				kind: companion.kind,
				email: companion.email || undefined,
				phone: companion.phone || undefined,
			})),
			note,
			songRequest,
		};

		startTransition(async () => {
			const response = await submitRsvp(token, payload);
			setResult(response.ok ? { ok: true } : { ok: false, error: response.error });
		});
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-8">
			{guests.map((guest) => (
				<fieldset
					key={guest.id}
					className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4"
				>
					<legend className="px-1 font-medium">
						{guest.firstName} {guest.lastName}
					</legend>
					{events.map((event) => (
						<label key={event.id} className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={guest.attendance[event.id] ?? false}
								onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
									updateAttendance(guest.id, event.id, changeEvent.target.checked)
								}
							/>
							{t(dictionary.rsvp.attendingLabel, { event: event.name })}
						</label>
					))}
					<label className="flex flex-col gap-1 text-sm">
						{dictionary.rsvp.dietaryLabel}
						<textarea
							className={fieldClassName}
							value={guest.dietary}
							placeholder={dictionary.rsvp.dietaryPlaceholder}
							onChange={(changeEvent: ChangeEvent<HTMLTextAreaElement>) =>
								updateDietary(guest.id, changeEvent.target.value)
							}
						/>
					</label>
				</fieldset>
			))}

			{companionAllowance > 0 && (
				<fieldset className="flex flex-col gap-4 rounded-lg border border-ink/10 p-4">
					<legend className="px-1 font-medium">{dictionary.rsvp.companionsHeading}</legend>
					<p className="text-sm text-ink/60">
						{t(dictionary.rsvp.companionsHint, { count: companionAllowance })}
					</p>
					{companions.map((companion) => (
						<div key={companion.key} className="grid gap-2 sm:grid-cols-2">
							<Input
								placeholder={dictionary.rsvp.companionFirstNameLabel}
								value={companion.firstName}
								onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
									updateCompanion(companion.key, { firstName: changeEvent.target.value })
								}
							/>
							<Input
								placeholder={dictionary.rsvp.companionLastNameLabel}
								value={companion.lastName}
								onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
									updateCompanion(companion.key, { lastName: changeEvent.target.value })
								}
							/>
							<select
								className={fieldClassName}
								value={companion.kind}
								onChange={(changeEvent: ChangeEvent<HTMLSelectElement>) =>
									updateCompanion(companion.key, {
										kind:
											changeEvent.target.value === GuestKind.CHILD
												? GuestKind.CHILD
												: GuestKind.ADULT,
									})
								}
							>
								<option value={GuestKind.ADULT}>{dictionary.common.adultLabel}</option>
								<option value={GuestKind.CHILD}>{dictionary.common.childLabel}</option>
							</select>
							<div className="flex items-center gap-2">
								<Input
									type="email"
									placeholder={dictionary.rsvp.companionEmailLabel}
									value={companion.email}
									onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
										updateCompanion(companion.key, { email: changeEvent.target.value })
									}
								/>
								<Button
									type="button"
									variant="ghost"
									onClick={() => removeCompanion(companion.key)}
								>
									{dictionary.rsvp.removeCompanionButton}
								</Button>
							</div>
							<Input
								type="tel"
								placeholder={dictionary.rsvp.companionPhoneLabel}
								value={companion.phone}
								onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
									updateCompanion(companion.key, { phone: changeEvent.target.value })
								}
							/>
							<p className="text-xs text-ink/50 sm:col-span-2">
								{dictionary.rsvp.companionContactHint}
							</p>
						</div>
					))}
					{companions.length < companionAllowance && (
						<Button type="button" variant="secondary" onClick={addCompanion}>
							{dictionary.rsvp.addCompanionButton}
						</Button>
					)}
				</fieldset>
			)}

			<label className="flex flex-col gap-1 text-sm">
				{dictionary.rsvp.noteLabel}
				<textarea
					className={fieldClassName}
					value={note}
					placeholder={dictionary.rsvp.notePlaceholder}
					onChange={(changeEvent: ChangeEvent<HTMLTextAreaElement>) =>
						setNote(changeEvent.target.value)
					}
				/>
			</label>
			<label htmlFor="songRequest" className="flex flex-col gap-1 text-sm">
				{dictionary.rsvp.songRequestLabel}
				<Input
					id="songRequest"
					value={songRequest}
					placeholder={dictionary.rsvp.songRequestPlaceholder}
					onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
						setSongRequest(changeEvent.target.value)
					}
				/>
			</label>

			{result && !result.ok && <p className="text-sm text-red-700">{result.error}</p>}
			{result?.ok && <p className="text-sm text-green">{dictionary.rsvp.submitSuccessMessage}</p>}

			<Button type="submit" disabled={isPending}>
				{dictionary.rsvp.submitButton}
			</Button>
		</form>
	);
}
