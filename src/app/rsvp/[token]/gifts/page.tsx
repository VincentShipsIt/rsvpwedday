import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GiftActions } from "@/app/rsvp/[token]/gifts/gift-actions";
import { GiftGrid, giftCountLine } from "@/components/site/gifts";
import { localizeGift, publishableGifts, sortByAvailability } from "@/domain/gifts";
import { SiteTheme } from "@/generated/prisma/enums";
import { getDictionary } from "@/i18n";
import { locales } from "@/i18n/locales";
import { db } from "@/lib/db";
import { dataTheme } from "@/lib/site-theme";

export const dynamic = "force-dynamic";

type GiftsPageProps = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: GiftsPageProps): Promise<Metadata> {
	const { token } = await params;
	const invitation = await db.invitation.findUnique({
		where: { token },
		select: { locale: true },
	});
	if (!invitation) {
		return {};
	}
	const dictionary = getDictionary(invitation.locale);
	// Who is bringing what is the couple's business; keep this page out of search results even
	// though the token already makes the URL unguessable.
	return { title: dictionary.gifts.title, robots: { index: false, follow: false } };
}

/*
 * The wish list as the guest's own household sees it, reached from their invitation link. The
 * public pages show the same list read-only; reserving lives here because it needs to know who is
 * asking, and the token is the only thing that says so.
 */
export default async function GiftsPage({ params }: GiftsPageProps) {
	const { token } = await params;

	const invitation = await db.invitation.findUnique({
		where: { token },
		include: { guests: { orderBy: { addedByGuest: "asc" } } },
	});
	if (!invitation) {
		notFound();
	}

	const [settings, siteContent, giftRecords] = await Promise.all([
		db.settings.findUnique({ where: { id: 1 }, select: { coupleNames: true } }),
		db.siteContent.findUnique({ where: { id: 1 }, select: { theme: true } }),
		db.gift.findMany({
			orderBy: { sortOrder: "asc" },
			include: {
				translations: true,
				claim: { select: { invitationId: true, guestName: true } },
			},
		}),
	]);

	const { locale } = invitation;
	const dictionary = getDictionary(locale);
	const localeDefinition = locales[locale];
	const theme = siteContent?.theme ?? SiteTheme.EDITORIAL;
	const coupleNames = settings?.coupleNames ?? "";

	const gifts = sortByAvailability(
		publishableGifts(giftRecords.map((gift) => localizeGift(gift, locale)))
	);
	// A gift is signed by a person rather than a household, the same way a photo in the book is.
	const guestNames = invitation.guests.map((guest) => guest.firstName).filter(Boolean);

	return (
		<main
			lang={locale}
			dir={localeDefinition.dir}
			data-theme={dataTheme[theme]}
			className="mx-auto flex min-h-screen max-w-6xl flex-col items-center gap-10 px-4 py-12 sm:px-6"
		>
			<header className="flex flex-col items-center gap-2 text-center">
				<p className="text-xs uppercase tracking-[0.3em] text-ink/50">{coupleNames}</p>
				<h1 className="text-3xl font-medium sm:text-4xl">{dictionary.gifts.title}</h1>
				<p className="text-sm text-ink/60">
					{gifts.length === 0 ? dictionary.gifts.emptyBody : giftCountLine(gifts, dictionary.gifts)}
				</p>
			</header>

			{gifts.length > 0 && (
				<GiftGrid
					gifts={gifts}
					copy={dictionary.gifts}
					viewerInvitationId={invitation.id}
					renderAction={(gift, status) => (
						<GiftActions
							token={token}
							gift={{ id: gift.id, title: gift.title }}
							status={status}
							guestNames={guestNames}
							copy={dictionary.gifts}
						/>
					)}
				/>
			)}

			<Link href={`/rsvp/${token}`} className="text-sm text-green underline underline-offset-4">
				{dictionary.gifts.backToInvitation}
			</Link>
		</main>
	);
}
