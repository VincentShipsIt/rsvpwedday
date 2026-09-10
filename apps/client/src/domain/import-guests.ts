import type { ImportGuestRow } from "@/domain/csv";
import { Attendance, type GuestKind } from "@/generated/prisma/enums";

export type ExistingImportGuest = {
	id: string;
	firstName: string;
	lastName: string;
	kind: GuestKind;
	email: string | null;
	phone: string | null;
	addedByGuest: boolean;
	attendance: { eventId: string; status: Attendance }[];
};
export type GuestImportUpdate = { id: string; data: Omit<ImportGuestRow, "id"> };
export type GuestImportPlan = {
	updates: GuestImportUpdate[];
	creates: Omit<ImportGuestRow, "id">[];
	retained: number;
	unchanged: number;
};

function normalized(value: string): string {
	return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}
function nameKey(guest: Pick<ImportGuestRow, "firstName" | "lastName" | "kind">): string {
	return JSON.stringify([normalized(guest.firstName), normalized(guest.lastName), guest.kind]);
}
function phoneKey(value: string | null): string {
	return value?.replace(/[^0-9+]/g, "") ?? "";
}

// Imports add or update people; omission never removes somebody or overwrites their RSVP fields.
// IDs are the reliable way to rename people. Legacy templates can use a unique name or contact.
export function planGuestImport(
	incoming: ImportGuestRow[],
	existing: ExistingImportGuest[]
): { ok: true; plan: GuestImportPlan } | { ok: false; error: string } {
	const matched = new Set<string>();
	const seenNames = new Set<string>();
	const updates: GuestImportUpdate[] = [];
	const creates: Omit<ImportGuestRow, "id">[] = [];
	let unchanged = 0;
	for (const guest of incoming) {
		const label = `${guest.firstName} ${guest.lastName}`;
		const key = nameKey(guest);
		if (!guest.id && seenNames.has(key))
			return {
				ok: false,
				error: `Duplicate guest "${label}". Use distinct guestId values for people with the same name.`,
			};
		seenNames.add(key);
		let candidates: ExistingImportGuest[];
		if (guest.id) {
			candidates = existing.filter((candidate) => candidate.id === guest.id);
			if (!candidates.length)
				return {
					ok: false,
					error: `guestId for "${label}" is unknown or belongs to another household.`,
				};
		} else {
			candidates = existing.filter((candidate) => nameKey(candidate) === key);
			if (!candidates.length)
				candidates = existing.filter(
					(candidate) =>
						candidate.kind === guest.kind &&
						((guest.email &&
							candidate.email &&
							normalized(guest.email) === normalized(candidate.email)) ||
							(phoneKey(guest.phone) && phoneKey(guest.phone) === phoneKey(candidate.phone)))
				);
		}
		if (candidates.length > 1)
			return {
				ok: false,
				error: `More than one existing guest matches "${label}". Supply guestId to identify the right person.`,
			};
		const match = candidates[0];
		if (!match) {
			creates.push({
				firstName: guest.firstName,
				lastName: guest.lastName,
				kind: guest.kind,
				email: guest.email,
				phone: guest.phone,
			});
			continue;
		}
		if (matched.has(match.id))
			return { ok: false, error: `Two CSV rows identify the same guest "${label}".` };
		if (match.kind !== guest.kind)
			return {
				ok: false,
				error: `The kind for "${label}" changed. Edit the household before importing.`,
			};
		matched.add(match.id);
		const data = {
			firstName: guest.firstName,
			lastName: guest.lastName,
			kind: guest.kind,
			email: guest.email || match.email,
			phone: guest.phone || match.phone,
		};
		if (Object.entries(data).every(([field, value]) => match[field as keyof typeof data] === value))
			unchanged += 1;
		else updates.push({ id: match.id, data });
	}
	// An unmatched old name and an unmatched new name could be the same person. Do not silently
	// create a duplicate and leave their existing reply attached to an obsolete name.
	if (
		creates.some((guest) =>
			existing.some(
				(candidate) =>
					!matched.has(candidate.id) && !candidate.addedByGuest && candidate.kind === guest.kind
			)
		)
	) {
		return {
			ok: false,
			error:
				"Cannot distinguish a renamed guest from a new guest. Supply guestId for name changes, or add the new person in the household editor first.",
		};
	}
	return {
		ok: true,
		plan: { updates, creates, retained: existing.length - matched.size, unchanged },
	};
}

export function eventImportImpact(guests: ExistingImportGuest[], eventIds: string[]) {
	const selected = new Set(eventIds);
	const removed = guests.flatMap((guest) =>
		guest.attendance.filter((row) => !selected.has(row.eventId))
	);
	return {
		removedMemberships: removed.length,
		removedResponses: removed.filter((row) => row.status !== Attendance.PENDING).length,
		needsReply: guests.some((guest) =>
			eventIds.some((eventId) => !guest.attendance.some((row) => row.eventId === eventId))
		),
	};
}
