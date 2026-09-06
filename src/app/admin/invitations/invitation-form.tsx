"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState, useTransition } from "react";
import type { InvitationGuestInput } from "@/app/admin/invitations/actions";
import { createInvitation, updateInvitation } from "@/app/admin/invitations/actions";
import { Button } from "@/components/button";
import { fieldClassName, Input } from "@/components/input";
import { GuestKind, type Locale } from "@/generated/prisma/client";
import { isLocale, localeCodes, locales } from "@/i18n/locales";

type GuestRow = InvitationGuestInput & { key: string };

function createGuestKey(): string {
	return crypto.randomUUID();
}

export type InvitationFormProps =
	| { mode: "create" }
	| {
			mode: "edit";
			invitationId: string;
			initialEmail: string;
			initialLocale: Locale;
			initialCompanionAllowance: number;
			initialGuests: InvitationGuestInput[];
	  };

export function InvitationForm(props: InvitationFormProps) {
	const [email, setEmail] = useState(props.mode === "edit" ? props.initialEmail : "");
	const [locale, setLocale] = useState<Locale>(props.mode === "edit" ? props.initialLocale : "en");
	const [companionAllowance, setCompanionAllowance] = useState(
		props.mode === "edit" ? props.initialCompanionAllowance : 0
	);
	const [guests, setGuests] = useState<GuestRow[]>(() =>
		(props.mode === "edit" ? props.initialGuests : []).map((guest) => ({
			...guest,
			key: createGuestKey(),
		}))
	);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	function addGuest() {
		setGuests((current) => [
			...current,
			{
				key: createGuestKey(),
				firstName: "",
				lastName: "",
				kind: GuestKind.ADULT,
				email: "",
				phone: "",
			},
		]);
	}

	function removeGuest(key: string) {
		setGuests((current) => current.filter((guest) => guest.key !== key));
	}

	function updateGuest(key: string, patch: Partial<GuestRow>) {
		setGuests((current) =>
			current.map((guest) => (guest.key === key ? { ...guest, ...patch } : guest))
		);
	}

	function handleSubmit(formEvent: FormEvent) {
		formEvent.preventDefault();
		setError(null);

		const payload = {
			email,
			locale,
			companionAllowance,
			guests: guests.map(({ key, ...guest }) => guest),
		};

		startTransition(async () => {
			const result =
				props.mode === "edit"
					? await updateInvitation(props.invitationId, payload)
					: await createInvitation(payload);

			if (!result.ok) {
				setError(result.error);
			}
		});
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-6">
			<label htmlFor="invitationEmail" className="flex flex-col gap-1 text-sm">
				Email
				<Input
					id="invitationEmail"
					type="email"
					value={email}
					onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
						setEmail(changeEvent.target.value)
					}
					required
				/>
			</label>
			<label className="flex flex-col gap-1 text-sm">
				Locale
				<select
					className={fieldClassName}
					value={locale}
					onChange={(changeEvent: ChangeEvent<HTMLSelectElement>) => {
						const next = changeEvent.target.value;
						if (isLocale(next)) {
							setLocale(next);
						}
					}}
				>
					{localeCodes.map((code) => (
						<option key={code} value={code}>
							{locales[code].label}
						</option>
					))}
				</select>
			</label>
			<label htmlFor="companionAllowance" className="flex flex-col gap-1 text-sm">
				Companion allowance
				<Input
					id="companionAllowance"
					type="number"
					min={0}
					value={companionAllowance}
					onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
						setCompanionAllowance(Number(changeEvent.target.value))
					}
				/>
			</label>

			<fieldset className="flex flex-col gap-4 rounded-lg border border-ink/10 p-4">
				<legend className="px-1 font-medium">Guests</legend>
				{guests.map((guest) => (
					<div key={guest.key} className="grid gap-2 sm:grid-cols-2">
						<Input
							placeholder="First name"
							value={guest.firstName}
							onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
								updateGuest(guest.key, { firstName: changeEvent.target.value })
							}
						/>
						<Input
							placeholder="Last name"
							value={guest.lastName}
							onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
								updateGuest(guest.key, { lastName: changeEvent.target.value })
							}
						/>
						<select
							className={fieldClassName}
							value={guest.kind}
							onChange={(changeEvent: ChangeEvent<HTMLSelectElement>) =>
								updateGuest(guest.key, {
									kind:
										changeEvent.target.value === GuestKind.CHILD
											? GuestKind.CHILD
											: GuestKind.ADULT,
								})
							}
						>
							<option value={GuestKind.ADULT}>Adult</option>
							<option value={GuestKind.CHILD}>Child</option>
						</select>
						<div className="flex items-center gap-2">
							<Input
								type="email"
								placeholder="Email"
								value={guest.email}
								onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
									updateGuest(guest.key, { email: changeEvent.target.value })
								}
							/>
							<Button type="button" variant="ghost" onClick={() => removeGuest(guest.key)}>
								Remove
							</Button>
						</div>
						<Input
							type="tel"
							placeholder="Phone"
							value={guest.phone}
							onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
								updateGuest(guest.key, { phone: changeEvent.target.value })
							}
						/>
					</div>
				))}
				<Button type="button" variant="secondary" onClick={addGuest}>
					Add guest
				</Button>
			</fieldset>

			{error && <p className="text-sm text-red-700">{error}</p>}

			<Button type="submit" disabled={isPending}>
				{props.mode === "edit" ? "Save" : "Create invitation"}
			</Button>
		</form>
	);
}
