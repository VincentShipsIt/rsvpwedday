"use client";

import { type FormEvent, useState, useTransition } from "react";
import { submitRsvp } from "@/app/rsvp/[token]/actions";
import { Button } from "@/components/button";
import { fieldClassName, Input } from "@/components/input";
import { MAX_CHILDREN_UNDER_12 } from "@/domain/children";
import { GuestKind } from "@/generated/prisma/enums";
import { type Dictionary, t } from "@/i18n";

type Answer = { eventId: string; attending: boolean };
type FormGuest = {
	id: string;
	firstName: string;
	lastName: string;
	dietary: string;
	attendance: Answer[];
};
type Companion = {
	id?: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	attendance: Answer[];
};
export type RsvpFormProps = {
	token: string;
	dictionary: Dictionary;
	companionAllowance: number;
	guests: FormGuest[];
	companions: Companion[];
	events: { id: string; name: string }[];
	initialNote: string;
	initialSongRequest: string;
	initialChildrenUnder12: number;
	initialChildrenDietary: string;
	initialChildAttendance: Record<string, number>;
};

export function RsvpForm(props: RsvpFormProps) {
	const { token, dictionary, companionAllowance, events } = props;
	const copy = dictionary.rsvp;
	const [guests, setGuests] = useState(props.guests);
	const [companions, setCompanions] = useState(() =>
		props.companions.map((guest) => ({ ...guest, key: crypto.randomUUID() }))
	);
	const [children, setChildren] = useState(props.initialChildrenUnder12);
	const [childAttendance, setChildAttendance] = useState(props.initialChildAttendance);
	const [childrenDietary, setChildrenDietary] = useState(props.initialChildrenDietary);
	const [note, setNote] = useState(props.initialNote);
	const [songRequest, setSongRequest] = useState(props.initialSongRequest);
	const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
	const [pending, startTransition] = useTransition();

	function changeCompanion(key: string, patch: Partial<Companion>) {
		setCompanions((current) =>
			current.map((guest) => (guest.key === key ? { ...guest, ...patch } : guest))
		);
	}
	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setResult(null);
		startTransition(async () => {
			try {
				const response = await submitRsvp(token, {
					guests: guests.map(({ id, dietary, attendance }) => ({
						guestId: id,
						dietary,
						attendance,
					})),
					companions: companions.map(({ key, ...guest }) => ({
						...guest,
						kind: GuestKind.ADULT,
						email: guest.email || undefined,
						phone: guest.phone || undefined,
					})),
					childrenUnder12: children,
					childrenDietary,
					childAttendance: events.map((event) => ({
						eventId: event.id,
						count: childAttendance[event.id] ?? 0,
					})),
					note,
					songRequest,
				});
				setResult(response.ok ? { ok: true } : { ok: false, error: response.error });
			} catch {
				setResult({ ok: false, error: copy.saveError });
			}
		});
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-8" aria-busy={pending}>
			<fieldset disabled={pending} className="flex flex-col gap-8">
				{guests.map((guest) => (
					<fieldset
						key={guest.id}
						className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4"
					>
						<legend className="px-1 font-medium">
							{guest.firstName} {guest.lastName}
						</legend>
						{guest.attendance.map((answer) => {
							const event = events.find((event) => event.id === answer.eventId);
							if (!event) return null;
							return (
								<label key={event.id} className="flex min-h-11 items-center gap-3 text-sm">
									<input
										type="checkbox"
										checked={answer.attending}
										onChange={(change) =>
											setGuests((current) =>
												current.map((row) =>
													row.id === guest.id
														? {
																...row,
																attendance: row.attendance.map((a) =>
																	a.eventId === event.id
																		? { ...a, attending: change.target.checked }
																		: a
																),
															}
														: row
												)
											)
										}
									/>
									{t(copy.attendingLabel, { event: event.name })}
								</label>
							);
						})}
						<label className="flex flex-col gap-1 text-sm">
							{copy.dietaryLabel}
							<textarea
								className={fieldClassName}
								value={guest.dietary}
								maxLength={500}
								placeholder={copy.dietaryPlaceholder}
								onChange={(event) =>
									setGuests((current) =>
										current.map((row) =>
											row.id === guest.id ? { ...row, dietary: event.target.value } : row
										)
									)
								}
							/>
						</label>
					</fieldset>
				))}

				{(companionAllowance > 0 || companions.length > 0) && (
					<fieldset className="flex flex-col gap-4 rounded-lg border border-ink/10 p-4">
						<legend className="px-1 font-medium">{copy.companionsHeading}</legend>
						<p className="text-sm text-ink/70">
							{t(copy.companionsHint, { count: companionAllowance })}
						</p>
						{companions.map((guest, index) => (
							<fieldset
								key={guest.key}
								className="grid gap-3 border-t border-ink/10 pt-4 sm:grid-cols-2"
							>
								<legend className="px-1 text-sm font-medium">
									{copy.additionalGuestLabel} {index + 1}
								</legend>
								<label
									className="flex flex-col gap-1 text-sm"
									htmlFor={`guest-${guest.key}-firstName`}
								>
									{copy.companionFirstNameLabel}
									<Input
										id={`guest-${guest.key}-firstName`}
										value={guest.firstName}
										required
										maxLength={100}
										autoComplete="given-name"
										onChange={(event) =>
											changeCompanion(guest.key, { firstName: event.target.value })
										}
									/>
								</label>
								<label
									className="flex flex-col gap-1 text-sm"
									htmlFor={`guest-${guest.key}-lastName`}
								>
									{copy.companionLastNameLabel}
									<Input
										id={`guest-${guest.key}-lastName`}
										value={guest.lastName}
										required
										maxLength={100}
										autoComplete="family-name"
										onChange={(event) =>
											changeCompanion(guest.key, { lastName: event.target.value })
										}
									/>
								</label>
								<label className="flex flex-col gap-1 text-sm" htmlFor={`guest-${guest.key}-email`}>
									{copy.companionEmailLabel}
									<Input
										id={`guest-${guest.key}-email`}
										type="email"
										value={guest.email}
										autoComplete="email"
										required={!guest.phone.trim()}
										onChange={(event) => changeCompanion(guest.key, { email: event.target.value })}
									/>
								</label>
								<label className="flex flex-col gap-1 text-sm" htmlFor={`guest-${guest.key}-phone`}>
									{copy.companionPhoneLabel}
									<Input
										id={`guest-${guest.key}-phone`}
										type="tel"
										value={guest.phone}
										autoComplete="tel"
										maxLength={30}
										required={!guest.email.trim()}
										onChange={(event) => changeCompanion(guest.key, { phone: event.target.value })}
									/>
								</label>
								<p className="text-xs text-ink/70 sm:col-span-2">{copy.companionContactHint}</p>
								<div className="flex flex-col gap-1 sm:col-span-2">
									{events.map((event) => (
										<label key={event.id} className="flex min-h-11 items-center gap-3 text-sm">
											<input
												type="checkbox"
												checked={
													guest.attendance.find((row) => row.eventId === event.id)?.attending ??
													false
												}
												onChange={(change) =>
													changeCompanion(guest.key, {
														attendance: guest.attendance.map((row) =>
															row.eventId === event.id
																? { ...row, attending: change.target.checked }
																: row
														),
													})
												}
											/>
											{t(copy.attendingLabel, { event: event.name })}
										</label>
									))}
								</div>
								<Button
									type="button"
									variant="ghost"
									onClick={() =>
										setCompanions((current) => current.filter((row) => row.key !== guest.key))
									}
								>
									{copy.removeCompanionButton}
								</Button>
							</fieldset>
						))}
						{companions.length < companionAllowance && (
							<Button
								type="button"
								variant="secondary"
								onClick={() =>
									setCompanions((current) => [
										...current,
										{
											key: crypto.randomUUID(),
											firstName: "",
											lastName: "",
											email: "",
											phone: "",
											attendance: events.map((event) => ({
												eventId: event.id,
												attending: guests.some((guest) =>
													guest.attendance.some((row) => row.eventId === event.id && row.attending)
												),
											})),
										},
									])
								}
							>
								{copy.addCompanionButton}
							</Button>
						)}
					</fieldset>
				)}

				<fieldset className="flex flex-col gap-4 rounded-lg border border-ink/10 p-4">
					<legend className="px-1 font-medium">{copy.childrenHeading}</legend>
					<p className="text-sm text-ink/70">{copy.childrenHint}</p>
					<label className="flex flex-col gap-1 text-sm" htmlFor={"children-count"}>
						{copy.childrenCountLabel}
						<Input
							id={"children-count"}
							type="number"
							inputMode="numeric"
							min={0}
							max={MAX_CHILDREN_UNDER_12}
							step={1}
							value={children}
							onChange={(event) => {
								const count = Math.max(
									0,
									Math.min(MAX_CHILDREN_UNDER_12, Math.trunc(Number(event.target.value)))
								);
								setChildren(count);
								setChildAttendance((current) =>
									Object.fromEntries(
										events.map((event) => [event.id, Math.min(current[event.id] ?? 0, count)])
									)
								);
							}}
						/>
					</label>
					{children > 0 && (
						<>
							{events.map((event) => (
								<label
									key={event.id}
									className="flex flex-col gap-1 text-sm"
									htmlFor={`children-${event.id}`}
								>
									{t(copy.childrenAtEventLabel, { event: event.name })}
									<Input
										id={`children-${event.id}`}
										type="number"
										inputMode="numeric"
										min={0}
										max={children}
										step={1}
										value={childAttendance[event.id] ?? 0}
										onChange={(change) =>
											setChildAttendance((current) => ({
												...current,
												[event.id]: Number(change.target.value),
											}))
										}
									/>
								</label>
							))}
							<label className="flex flex-col gap-1 text-sm">
								{copy.childrenDietaryLabel}
								<textarea
									className={fieldClassName}
									maxLength={500}
									value={childrenDietary}
									onChange={(event) => setChildrenDietary(event.target.value)}
								/>
							</label>
						</>
					)}
				</fieldset>
				<label className="flex flex-col gap-1 text-sm">
					{copy.noteLabel}
					<textarea
						className={fieldClassName}
						value={note}
						maxLength={2000}
						placeholder={copy.notePlaceholder}
						onChange={(event) => setNote(event.target.value)}
					/>
				</label>
				<label className="flex flex-col gap-1 text-sm" htmlFor={"song-request"}>
					{copy.songRequestLabel}
					<Input
						id={"song-request"}
						value={songRequest}
						maxLength={500}
						placeholder={copy.songRequestPlaceholder}
						onChange={(event) => setSongRequest(event.target.value)}
					/>
				</label>
				<Button type="submit">{pending ? copy.savingLabel : copy.submitButton}</Button>
			</fieldset>
			{result && !result.ok && (
				<p role="alert" className="text-sm text-red-700">
					{result.error}
				</p>
			)}
			{result?.ok && (
				<p role="status" className="text-sm text-green">
					{copy.submitSuccessMessage}
				</p>
			)}
		</form>
	);
}
