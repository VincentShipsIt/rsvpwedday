/*
 * The wish list's own decisions, kept out of the pages so the public block, the guest's own list
 * and the admin overview all answer the same questions the same way — and so the answers are
 * testable without a database.
 *
 * The list is deliberately neutral about what a gift *is*. A present and a night of the honeymoon
 * are the same row: an optional picture, an optional link, a free-text price and the couple's own
 * words. What turns a gift registry into a honeymoon registry is the copy on the block above it.
 */

import type { Locale } from "@/generated/prisma/enums";

/** Long enough for "Grandma and the whole Berlin side of the family". */
export const MAX_GIFT_NAME_LENGTH = 80;
/** A word for the couple, not a letter — the admin overview shows these in a table. */
export const MAX_GIFT_MESSAGE_LENGTH = 200;

export type GiftClaimView = {
	/** The household that took it, which is what "is this mine?" is answered against. */
	invitationId: string;
	guestName: string;
};

export type GiftView = {
	id: string;
	imageUrl: string | null;
	url: string | null;
	price: string;
	title: string;
	body: string;
	claim: GiftClaimView | null;
};

/*
 * What one guest sees on one gift. `mine` exists so a household can always take its own
 * reservation back while never touching anyone else's, which is the whole of the permission model:
 * the guest route decides nothing beyond this.
 */
export type GiftStatus = "available" | "mine" | "taken";

export function giftStatus(gift: GiftView, viewerInvitationId: string | null): GiftStatus {
	if (!gift.claim) {
		return "available";
	}
	return viewerInvitationId !== null && gift.claim.invitationId === viewerInvitationId
		? "mine"
		: "taken";
}

export function canRelease(gift: GiftView, viewerInvitationId: string | null): boolean {
	return giftStatus(gift, viewerInvitationId) === "mine";
}

export type GiftSummary = { total: number; taken: number; available: number };

export function summarizeGifts(gifts: GiftView[]): GiftSummary {
	const taken = gifts.filter((gift) => gift.claim !== null).length;
	return { total: gifts.length, taken, available: gifts.length - taken };
}

/*
 * Available first, so a guest opening the list sees what they can still do something about rather
 * than scrolling past everything already spoken for. Within each group the couple's own order is
 * kept, and the gifts this household took sort with the rest of the taken ones — they are done
 * either way, and hoisting them would push the actual choices further down.
 */
export function sortByAvailability(gifts: GiftView[]): GiftView[] {
	return [...gifts].sort((a, b) => Number(a.claim !== null) - Number(b.claim !== null));
}

// The same locale fallback events, milestones and blocks use: the requested language, else the
// first translation that exists, so a gift typed in one language still shows up in the others.
type GiftRecord = {
	id: string;
	imageUrl: string | null;
	url: string | null;
	price: string;
	claim: { invitationId: string; guestName: string } | null;
	translations: { locale: Locale; title: string; body: string }[];
};

export function localizeGift(gift: GiftRecord, locale: Locale): GiftView {
	const translation =
		gift.translations.find((candidate) => candidate.locale === locale) ?? gift.translations[0];
	return {
		id: gift.id,
		imageUrl: gift.imageUrl,
		url: gift.url,
		price: gift.price,
		title: translation?.title ?? "",
		body: translation?.body ?? "",
		claim: gift.claim,
	};
}

/*
 * A gift nobody has named yet is not a gift a guest can choose, so it never reaches the public
 * list — the same rule an empty block follows. Everything else about a row is optional.
 */
export function isGiftPublishable(gift: GiftView): boolean {
	return gift.title.trim() !== "";
}

export function publishableGifts(gifts: GiftView[]): GiftView[] {
	return gifts.filter(isGiftPublishable);
}
