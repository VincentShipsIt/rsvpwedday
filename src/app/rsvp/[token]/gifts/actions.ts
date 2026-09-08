"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MAX_GIFT_MESSAGE_LENGTH, MAX_GIFT_NAME_LENGTH } from "@/domain/gifts";
import { db } from "@/lib/db";

/*
 * Reserving and releasing a gift, both bound to the invitation token in the URL. That token is the
 * whole permission model: it says which household is acting, and a household may only ever touch
 * its own reservation. Neither action trusts anything the browser says about who owns what.
 *
 * These two return a reason code rather than a sentence, unlike the admin's `FormActionResult`:
 * the guest reads their own language, so the wording lives in the dictionary and the client picks
 * it. "Someone just took that one" in particular has to arrive in Kurmanji if that is the
 * invitation's locale.
 */

export type GiftActionResult =
	| { ok: true }
	| { ok: false; reason: "already-taken" | "not-found" | "invalid" };

const reserveSchema = z.object({
	giftId: z.string().min(1),
	guestName: z.string().trim().min(1).max(MAX_GIFT_NAME_LENGTH),
	message: z.string().trim().max(MAX_GIFT_MESSAGE_LENGTH),
});

export type ReserveGiftInput = z.infer<typeof reserveSchema>;

/** Prisma's unique-constraint code: another household reached this gift first. */
const UNIQUE_VIOLATION = "P2002";

function isUniqueViolation(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code?: unknown }).code === UNIQUE_VIOLATION
	);
}

function findInvitation(token: string) {
	return db.invitation.findUnique({ where: { token }, select: { id: true } });
}

// The list appears on the guest's own page and on whichever public pages carry a wish-list block.
function revalidateGifts(token: string) {
	revalidatePath(`/rsvp/${token}/gifts`);
	revalidatePath("/", "layout");
}

/*
 * Takes a gift for this household. `GiftClaim.giftId` is the primary key, so two guests pressing
 * the button in the same second cannot both succeed: the second insert fails, and that guest is
 * told to pick something else instead of the two of them quietly buying the same kettle.
 */
export async function reserveGift(
	token: string,
	input: ReserveGiftInput
): Promise<GiftActionResult> {
	const parsed = reserveSchema.safeParse(input);
	if (!parsed.success) {
		return { ok: false, reason: "invalid" };
	}

	const invitation = await findInvitation(token);
	if (!invitation) {
		return { ok: false, reason: "not-found" };
	}

	const gift = await db.gift.findUnique({
		where: { id: parsed.data.giftId },
		select: { id: true },
	});
	if (!gift) {
		return { ok: false, reason: "not-found" };
	}

	try {
		await db.giftClaim.create({
			data: {
				giftId: gift.id,
				invitationId: invitation.id,
				guestName: parsed.data.guestName,
				message: parsed.data.message,
			},
		});
	} catch (error) {
		if (isUniqueViolation(error)) {
			return { ok: false, reason: "already-taken" };
		}
		throw error;
	}

	revalidateGifts(token);
	return { ok: true };
}

/*
 * Gives a gift back to the list. The delete is scoped by `invitationId` as well as `giftId`, so a
 * guest who edits the request cannot release somebody else's reservation — a mismatched household
 * deletes nothing at all.
 */
export async function releaseGift(token: string, giftId: string): Promise<GiftActionResult> {
	const invitation = await findInvitation(token);
	if (!invitation) {
		return { ok: false, reason: "not-found" };
	}

	const { count } = await db.giftClaim.deleteMany({
		where: { giftId, invitationId: invitation.id },
	});
	if (count === 0) {
		return { ok: false, reason: "already-taken" };
	}

	revalidateGifts(token);
	return { ok: true };
}
