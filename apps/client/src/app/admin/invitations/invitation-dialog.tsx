"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import type { InvitationGuestInput } from "@/app/admin/invitations/actions";
import { createInvitation, updateInvitation } from "@/app/admin/invitations/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
			childrenUnder12: number;
			guests: InvitationGuestInput[];
			eventIds: string[];
	  };

export type InvitationDialogEvent = { id: string; name: string };

export function InvitationDialog({
	target,
	events,
	onOpenChange,
}: {
	target: InvitationDialogTarget | null;
	events: InvitationDialogEvent[];
	onOpenChange: (open: boolean) => void;
}) {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [locale, setLocale] = useState<Locale>("en");
	const [companionAllowance, setCompanionAllowance] = useState(0);
	const [childrenUnder12, setChildrenUnder12] = useState(0);
	const [guests, setGuests] = useState<GuestRow[]>([]);
	const [eventIds, setEventIds] = useState<string[]>([]);
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
			setChildrenUnder12(target.childrenUnder12);
			setGuests(target.guests.map((guest) => ({ ...guest, key: createGuestKey() })));
			setEventIds(target.eventIds);
		} else {
			setEmail("");
			setLocale("en");
			setCompanionAllowance(0);
			setChildrenUnder12(0);
			setGuests([emptyGuestRow()]);
			// A new household is invited to everything until the couple unticks something.
			setEventIds(events.map((event) => event.id));
		}
	}, [target, events]);

	function toggleEvent(eventId: string, checked: boolean) {
		setEventIds((current) =>
			checked ? Array.from(new Set([...current, eventId])) : current.filter((id) => id !== eventId)
		);
	}

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
			childrenUnder12,
			guests: guests.map(({ key, ...guest }) => guest),
			eventIds,
		};

		startTransition(async () => {
			try {
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
			} catch {
				setError("The invitation could not be saved. Please try again.");
			}
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
						One household email, named guests aged 12 and over, and a count of younger children.
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
						<Label htmlFor="companionAllowance">
							Additional guests aged 12 and over (+1 allowance)
						</Label>
						<Input
							id="companionAllowance"
							type="number"
							min={0}
							value={companionAllowance}
							onChange={(event) => setCompanionAllowance(Number(event.target.value))}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="childrenUnder12">Children under 12</Label>
						<Input
							id="childrenUnder12"
							type="number"
							min={0}
							max={20}
							step={1}
							value={childrenUnder12}
							onChange={(event) => setChildrenUnder12(Number(event.target.value))}
						/>
						<p className="text-xs text-muted-foreground">
							Counted separately from the +1 allowance. No names or contact details needed.
						</p>
					</div>
					<fieldset className="flex flex-col gap-2 rounded-lg border p-4">
						<legend className="px-1 text-sm font-medium">Invited to</legend>
						{events.length === 0 && (
							<p className="text-sm text-muted-foreground">
								No events yet. Add them under Website.
							</p>
						)}
						{events.map((event) => {
							const checkboxId = `invitation-event-${event.id}`;
							return (
								<div key={event.id} className="flex items-center gap-2">
									<Checkbox
										id={checkboxId}
										checked={eventIds.includes(event.id)}
										onCheckedChange={(checked) => toggleEvent(event.id, checked === true)}
									/>
									<Label htmlFor={checkboxId} className="font-normal">
										{event.name}
									</Label>
								</div>
							);
						})}
						{events.length > 0 && eventIds.length === 0 && (
							<p className="text-sm text-destructive">Pick at least one event.</p>
						)}
					</fieldset>

					<fieldset className="flex flex-col gap-4 rounded-lg border p-4">
						<legend className="px-1 text-sm font-medium">Named guests (12 and over)</legend>
						{guests.map((guest, index) => (
							<fieldset key={guest.key} className="grid gap-3 sm:grid-cols-2">
								<legend className="mb-2 text-sm font-medium">Guest {index + 1}</legend>
								<label className="grid gap-1 text-sm" htmlFor={`guest-${guest.key}-firstName`}>
									First name
									<Input
										id={`guest-${guest.key}-firstName`}
										value={guest.firstName}
										required
										onChange={(event) => updateGuest(guest.key, { firstName: event.target.value })}
									/>
								</label>
								<label className="grid gap-1 text-sm" htmlFor={`guest-${guest.key}-lastName`}>
									Last name
									<Input
										id={`guest-${guest.key}-lastName`}
										value={guest.lastName}
										required
										onChange={(event) => updateGuest(guest.key, { lastName: event.target.value })}
									/>
								</label>
								<label className="grid gap-1 text-sm" htmlFor={`guest-${guest.key}-email`}>
									Email (optional)
									<Input
										id={`guest-${guest.key}-email`}
										type="email"
										value={guest.email}
										onChange={(event) => updateGuest(guest.key, { email: event.target.value })}
									/>
								</label>
								<label className="grid gap-1 text-sm" htmlFor={`guest-${guest.key}-phone`}>
									Phone (optional)
									<Input
										id={`guest-${guest.key}-phone`}
										type="tel"
										value={guest.phone}
										onChange={(event) => updateGuest(guest.key, { phone: event.target.value })}
									/>
								</label>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => removeGuest(guest.key)}
								>
									Remove guest
								</Button>
							</fieldset>
						))}
						<Button type="button" variant="secondary" size="sm" onClick={addGuest}>
							Add guest
						</Button>
					</fieldset>

					{error && <p className="text-sm text-destructive">{error}</p>}
				</div>

				<DialogFooter>
					<Button
						type="button"
						disabled={isPending || eventIds.length === 0}
						onClick={handleSubmit}
					>
						{target?.mode === "edit" ? "Save" : "Create invitation"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
