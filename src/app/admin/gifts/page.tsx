import { type ClaimRow, GiftClaims } from "@/app/admin/gifts/gift-claims";
import { type GiftState, GiftsForm } from "@/app/admin/gifts/gifts-form";
import { localizeGift, publishableGifts, summarizeGifts } from "@/domain/gifts";
import { Locale } from "@/generated/prisma/enums";
import { localeCodes } from "@/i18n/locales";
import { isBlobConfigured } from "@/lib/blob";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { isImageGenerationConfigured } from "@/lib/replicate";

export const dynamic = "force-dynamic";

/*
 * The wish list and who has taken what, on one page: the couple edits the list at the top and
 * reads the reservations underneath, which is the order they actually use it in — the list is
 * written once, the reservations are read all spring.
 */
export default async function GiftsAdminPage() {
	const gifts = await db.gift.findMany({
		orderBy: { sortOrder: "asc" },
		include: {
			translations: true,
			claim: {
				select: {
					invitationId: true,
					guestName: true,
					message: true,
					createdAt: true,
					invitation: { select: { email: true } },
				},
			},
		},
	});

	// The admin is English-only, so the overview and the counts read the English copy the same way
	// the illustration prompts do.
	const summary = summarizeGifts(
		publishableGifts(gifts.map((gift) => localizeGift(gift, Locale.en)))
	);

	// Newest reservation first, sorted on the timestamp itself rather than the formatted date,
	// which sorts alphabetically and would scatter the months.
	const claims: ClaimRow[] = gifts
		.flatMap((gift) => (gift.claim ? [{ gift, claim: gift.claim }] : []))
		.sort((a, b) => b.claim.createdAt.getTime() - a.claim.createdAt.getTime())
		.map(({ gift, claim }) => ({
			giftId: gift.id,
			giftTitle: localizeGift(gift, Locale.en).title || "Untitled gift",
			price: gift.price,
			guestName: claim.guestName,
			household: claim.invitation.email,
			message: claim.message,
			createdAt: formatDate(claim.createdAt, Locale.en),
		}));

	const initialGifts: GiftState[] = gifts.map((gift) => ({
		id: gift.id,
		sortOrder: gift.sortOrder,
		imageUrl: gift.imageUrl ?? "",
		url: gift.url ?? "",
		price: gift.price,
		claimedBy: gift.claim?.guestName ?? null,
		translations: localeCodes.map((code) => {
			const translation = gift.translations.find((candidate) => candidate.locale === code);
			return { locale: code, title: translation?.title ?? "", body: translation?.body ?? "" };
		}),
	}));

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-medium">Wish list</h1>
				<p className="text-sm text-muted-foreground">
					What you would love to be given — presents, or pieces of the honeymoon. Guests reserve
					from their own invitation link, and a gift someone has taken shows as already taken to
					everyone else, so nothing is bought twice. Add a wish-list block to a page in Pages to
					show it on the site; the heading and intro live on that block.
				</p>
			</div>

			<GiftClaims claims={claims} giftCount={summary.total} />

			<GiftsForm
				initialGifts={initialGifts}
				blobConfigured={isBlobConfigured()}
				aiConfigured={isImageGenerationConfigured()}
			/>
		</div>
	);
}
