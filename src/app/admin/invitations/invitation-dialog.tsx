"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import type { InvitationGuestInput } from "@/app/admin/invitations/actions";
import { createInvitation, updateInvitation } from "@/app/admin/invitations/actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { GuestKind, type Locale } from "@/generated/prisma/enums";
import { isLocale, localeCodes, locales } from "@/i18n/locales";

type GuestRow = InvitationGuestInput & { key: string };

function createGuestKey(): string {
	return crypto.randomUUID();
}

function emptyGuestRow(): GuestRow {
	return {
		key: createGuestKey(),
		firstName: "",
		lastName: "",
		kind: GuestKind.ADULT,
		email: "",
		phone: "",
	};
}

export type InvitationDialogTarget =
	| { mode: "create" }
	| {
			mode: "edit";
			invitationId: string;
			email: string;
			locale: Locale;
			companionAllowance: number;
			guests: InvitationGuestInput[];
	  };

export function InvitationDialog({
	target,
	onOpenChange,
}: {
	target: InvitationDialogTarget | null;
	onOpenChange: (open: boolean) => void;
}) {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [locale, setLocale] = useState<Locale>("en");
	const [companionAllowance, setCompanionAllowance] = useState(0);
	const [guests, setGuests] = useState<GuestRow[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	// Re-seed local form state whenever a different target opens (create, or a specific
	// invitation to edit); `target` is `null` while the dialog is closed.
	useEffect(() => {
		if (!target) {
			return;
		}
		setError(null);
		if (target.mode === "edit") {
			setEmail(target.email);
			setLocale(target.locale);
			setCompanionAllowance(target.companionAllowance);
			setGuests(target.guests.map((guest) => ({ ...guest, key: createGuestKey() })));
		} else {
			setEmail("");
			setLocale("en");
			setCompanionAllowance(0);
			setGuests([]);
		}
	}, [target]);

	function addGuest() {
		setGuests((current) => [...current, emptyGuestRow()]);
	}

	function removeGuest(key: string) {
		setGuests((current) => current.filter((guest) => guest.key !== key));
	}

	function updateGuest(key: string, patch: Partial<GuestRow>) {
		setGuests((current) =>
			current.map((guest) => (guest.key === key ? { ...guest, ...patch } : guest))
		);
	}

	function handleSubmit() {
		if (!target) {
			return;
		}
		setError(null);

		const payload = {
			email,
			locale,
			companionAllowance,
			guests: guests.map(({ key, ...guest }) => guest),
		};

		startTransition(async () => {
			const result =
				target.mode === "edit"
					? await updateInvitation(target.invitationId, payload)
					: await createInvitation(payload);

			if (!result.ok) {
				setError(result.error);
				return;
			}

			toast.success(target.mode === "edit" ? "Invitation updated" : "Invitation created");
			onOpenChange(false);
			router.refresh();
		});
	}

	return (
		<Dialog open={target !== null} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{target?.mode === "edit" ? "Edit invitation" : "New invitation"}
					</DialogTitle>
					<DialogDescription>
						An invitation covers one email and every named guest it's addressed to.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="invitationEmail">Email</Label>
						<Input
							id="invitationEmail"
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							required
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="invitationLocale">Locale</Label>
						<Select
							value={locale}
							onValueChange={(value) => {
								if (isLocale(value)) {
									setLocale(value);
								}
							}}
						>
							<SelectTrigger id="invitationLocale" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{localeCodes.map((code) => (
									<SelectItem key={code} value={code}>
										{locales[code].label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="companionAllowance">Companion allowance</Label>
						<Input
							id="companionAllowance"
							type="number"
							min={0}
							value={companionAllowance}
							onChange={(event) => setCompanionAllowance(Number(event.target.value))}
						/>
					</div>

					<fieldset className="flex flex-col gap-4 rounded-lg border p-4">
						<legend className="px-1 text-sm font-medium">Guests</legend>
						{guests.map((guest) => (
							<div key={guest.key} className="grid gap-2 sm:grid-cols-2">
								<Input
									placeholder="First name"
									value={guest.firstName}
									onChange={(event) => updateGuest(guest.key, { firstName: event.target.value })}
								/>
								<Input
									placeholder="Last name"
									value={guest.lastName}
									onChange={(event) => updateGuest(guest.key, { lastName: event.target.value })}
								/>
								<Select
									value={guest.kind}
									onValueChange={(value) =>
										updateGuest(guest.key, {
											kind: value === GuestKind.CHILD ? GuestKind.CHILD : GuestKind.ADULT,
										})
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={GuestKind.ADULT}>Adult</SelectItem>
										<SelectItem value={GuestKind.CHILD}>Child</SelectItem>
									</SelectContent>
								</Select>
								<div className="flex items-center gap-2">
									<Input
										type="email"
										placeholder="Email"
										value={guest.email}
										onChange={(event) => updateGuest(guest.key, { email: event.target.value })}
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => removeGuest(guest.key)}
									>
										Remove
									</Button>
								</div>
								<Input
									type="tel"
									placeholder="Phone"
									value={guest.phone}
									onChange={(event) => updateGuest(guest.key, { phone: event.target.value })}
								/>
							</div>
						))}
						<Button type="button" variant="secondary" size="sm" onClick={addGuest}>
							Add guest
						</Button>
					</fieldset>

					{error && <p className="text-sm text-destructive">{error}</p>}
				</div>

				<DialogFooter>
					<Button type="button" disabled={isPending} onClick={handleSubmit}>
						{target?.mode === "edit" ? "Save" : "Create invitation"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
