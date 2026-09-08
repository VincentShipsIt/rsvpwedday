"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { childAttendanceCounts, childrenUnder12 } from "@/domain/children";
import { parseImportCsv } from "@/domain/csv";
import { eventImportImpact, planGuestImport } from "@/domain/import-guests";
import { newToken } from "@/domain/token";
import type { Prisma } from "@/generated/prisma/client";
import { GuestKind } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { FormActionResult } from "@/lib/form-action";
import { syncHouseholdAttendance } from "@/lib/household-attendance";
import { requireAdmin } from "@/lib/require-admin";

export type ImportSummary = {
	newHouseholds: number;
	existingHouseholds: number;
	addedGuests: number;
	updatedGuests: number;
	retainedGuests: number;
	unchangedGuests: number;
	removedMemberships: number;
	removedResponses: number;
	removedChildAttendance: number;
	repliesNeeded: number;
};
export type ImportReviewResult =
	| { ok: true; fingerprint: string; summary: ImportSummary }
	| { ok: false; error: string };
export type ImportCommitResult =
	| { ok: true; summary: ImportSummary }
	| { ok: false; error: string };

async function readImport(tx: Prisma.TransactionClient, text: string) {
	const events = await tx.event.findMany({
		select: { id: true, slug: true },
		orderBy: { id: "asc" },
	});
	const { invitations, errors } = parseImportCsv(text, {
		eventSlugs: events.map((event) => event.slug),
	});
	if (errors.length) throw new Error(errors[0]);
	if (!invitations.length) throw new Error("No rows to import.");
	const existing = await tx.invitation.findMany({
		where: {
			email: { in: invitations.map((invitation) => invitation.email), mode: "insensitive" },
		},
		include: {
			guests: { orderBy: { id: "asc" }, include: { attendance: { orderBy: { eventId: "asc" } } } },
			childAttendance: { orderBy: { eventId: "asc" } },
		},
		orderBy: { id: "asc" },
	});
	const summary: ImportSummary = {
		newHouseholds: 0,
		existingHouseholds: 0,
		addedGuests: 0,
		updatedGuests: 0,
		retainedGuests: 0,
		unchangedGuests: 0,
		removedMemberships: 0,
		removedResponses: 0,
		removedChildAttendance: 0,
		repliesNeeded: 0,
	};
	const plan = invitations.map((invitation) => {
		const matches = existing.filter(
			(household) => household.email.toLowerCase() === invitation.email
		);
		if (matches.length > 1)
			throw new Error(
				`${invitation.email}: more than one household uses this email. Resolve the duplicate invitations first.`
			);
		const household = matches[0];
		const merged = planGuestImport(invitation.guests, household?.guests ?? []);
		if (!merged.ok) throw new Error(`${invitation.email}: ${merged.error}`);
		if (
			household?.childrenUnder12 != null &&
			merged.plan.creates.some((guest) => guest.kind === GuestKind.CHILD)
		)
			throw new Error(
				`${invitation.email}: this household uses a childrenUnder12 count. Update that count instead of adding named CHILD rows.`
			);
		const companions =
			household?.guests.filter((guest) => guest.addedByGuest && guest.kind === GuestKind.ADULT)
				.length ?? 0;
		if (invitation.companionAllowance < companions)
			throw new Error(
				`${invitation.email}: the allowance cannot be lower than its ${companions} existing adult companions.`
			);
		const eventIds = events
			.filter((event) => !invitation.eventSlugs || invitation.eventSlugs.includes(event.slug))
			.map((event) => event.id);
		const impact = eventImportImpact(household?.guests ?? [], eventIds);
		const previousChildCount = household ? childrenUnder12(household) : 0;
		const childCount = invitation.childrenUnder12 ?? previousChildCount;
		const previousChildAttendance = household ? childAttendanceCounts(household) : {};
		const removedChildAttendance = Object.entries(previousChildAttendance).reduce(
			(total, [eventId, count]) =>
				total + (eventIds.includes(eventId) ? Math.max(0, count - childCount) : count),
			0
		);
		const needsReply =
			Boolean(household?.respondedAt) &&
			(merged.plan.creates.length > 0 || impact.needsReply || childCount > previousChildCount);
		if (household) summary.existingHouseholds += 1;
		else summary.newHouseholds += 1;
		summary.addedGuests += merged.plan.creates.length;
		summary.updatedGuests += merged.plan.updates.length;
		summary.retainedGuests += merged.plan.retained;
		summary.unchangedGuests += merged.plan.unchanged;
		summary.removedMemberships += impact.removedMemberships;
		summary.removedResponses += impact.removedResponses;
		summary.removedChildAttendance += removedChildAttendance;
		summary.repliesNeeded += Number(needsReply);
		return { invitation, household, guests: merged.plan, eventIds, needsReply };
	});
	const fingerprint = createHash("sha256")
		.update(JSON.stringify({ text, events, existing }))
		.digest("hex");
	return { plan, summary, fingerprint };
}

function importFailure(error: unknown): FormActionResult & { ok: false } {
	if (typeof error === "object" && error && "code" in error)
		return {
			ok: false,
			error: "The guest list changed during import. Review the CSV again before importing.",
		};
	return {
		ok: false,
		error: error instanceof Error ? error.message : "Could not import the guest list. Try again.",
	};
}

export async function reviewImport(text: string): Promise<ImportReviewResult> {
	await requireAdmin();
	try {
		const { summary, fingerprint } = await db.$transaction((tx) => readImport(tx, text), {
			isolationLevel: "RepeatableRead",
		});
		return { ok: true, summary, fingerprint };
	} catch (error) {
		return importFailure(error);
	}
}

export async function commitImport(
	text: string,
	reviewedFingerprint?: string
): Promise<ImportCommitResult> {
	await requireAdmin();
	if (!reviewedFingerprint)
		return { ok: false, error: "Review the import before applying changes." };
	try {
		const summary = await db.$transaction(
			async (tx) => {
				const prepared = await readImport(tx, text);
				if (prepared.fingerprint !== reviewedFingerprint)
					throw new Error(
						"The guest list or its replies changed after your review. Review again before importing."
					);
				for (const { invitation, household, guests, eventIds, needsReply } of prepared.plan) {
					if (!household) {
						const legacyChildren = guests.creates.some((guest) => guest.kind === GuestKind.CHILD);
						const count = invitation.childrenUnder12 ?? (legacyChildren ? null : 0);
						await tx.invitation.create({
							data: {
								email: invitation.email,
								locale: invitation.locale,
								companionAllowance: invitation.companionAllowance,
								childrenUnder12: count,
								token: newToken(),
								guests: {
									create: guests.creates.map((guest) => ({
										...guest,
										attendance: { create: eventIds.map((eventId) => ({ eventId })) },
									})),
								},
								...(count != null
									? {
											childAttendance: {
												create: eventIds.map((eventId) => ({ eventId, count: 0 })),
											},
										}
									: {}),
							},
						});
						continue;
					}
					for (const guest of guests.updates)
						await tx.guest.update({ where: { id: guest.id }, data: guest.data });
					for (const guest of guests.creates)
						await tx.guest.create({ data: { invitationId: household.id, ...guest } });
					// Before changing the aggregate count: legacy accepted child rows remain the source
					// for the first conversion, and shared synchronization preserves surviving responses.
					await syncHouseholdAttendance(tx, household.id, eventIds, invitation.childrenUnder12);
					await tx.invitation.update({
						where: { id: household.id },
						data: {
							locale: invitation.locale,
							companionAllowance: invitation.companionAllowance,
							...(invitation.childrenUnder12 !== undefined
								? { childrenUnder12: invitation.childrenUnder12 }
								: {}),
							...(needsReply ? { respondedAt: null } : {}),
						},
					});
				}
				return prepared.summary;
			},
			{ isolationLevel: "Serializable", timeout: 30000 }
		);
		revalidatePath("/admin", "layout");
		revalidatePath("/rsvp/[token]", "page");
		return { ok: true, summary };
	} catch (error) {
		return importFailure(error);
	}
}
