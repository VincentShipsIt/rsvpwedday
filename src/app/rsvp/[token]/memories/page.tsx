import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoBook } from "@/components/site/photo-book";
import { PhotoUpload } from "@/components/site/photo-upload";
import { type BookPhoto, buildBookPages, resolvePhotoBookAccess } from "@/domain/photo-book";
import { SiteTheme } from "@/generated/prisma/enums";
import { getDictionary, t } from "@/i18n";
import { locales } from "@/i18n/locales";
import { isBlobConfigured } from "@/lib/blob";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { dataTheme } from "@/lib/site-theme";

export const dynamic = "force-dynamic";

type MemoriesPageProps = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: MemoriesPageProps): Promise<Metadata> {
	const { token } = await params;
	const invitation = await db.invitation.findUnique({
		where: { token },
		select: { locale: true },
	});
	if (!invitation) {
		return {};
	}
	const dictionary = getDictionary(invitation.locale);
	// A shared album of a private wedding: keep it out of search results even though the token
	// already makes the URL unguessable.
	return { title: dictionary.photos.title, robots: { index: false, follow: false } };
}

/*
 * The shared memories book, reached from the guest's own invitation link. Uploading and reading
 * are both gated by that token, so the album never sits on a public URL; the couple opens the
 * book to guests on the day by setting the date on `/admin/memories`.
 */
export default async function MemoriesPage({ params }: MemoriesPageProps) {
	const { token } = await params;

	const invitation = await db.invitation.findUnique({
		where: { token },
		include: { guests: { orderBy: { addedByGuest: "asc" } } },
	});
	if (!invitation) {
		notFound();
	}

	const [settings, siteContent] = await Promise.all([
		db.settings.findUnique({ where: { id: 1 } }),
		db.siteContent.findUnique({ where: { id: 1 }, include: { translations: true } }),
	]);

	const access = resolvePhotoBookAccess(
		{
			enabled: siteContent?.photosEnabled ?? false,
			openAt: siteContent?.photosOpenAt ?? null,
			testMode: siteContent?.photosTestMode ?? false,
		},
		new Date()
	);
	if (access.state === "disabled") {
		notFound();
	}

	const { locale } = invitation;
	const dictionary = getDictionary(locale);
	const localeDefinition = locales[locale];
	const theme = siteContent?.theme ?? SiteTheme.EDITORIAL;
	const coupleNames = settings?.coupleNames ?? "";
	const translation =
		siteContent?.translations.find((candidate) => candidate.locale === locale) ??
		siteContent?.translations[0];
	const title = translation?.photosTitle || dictionary.photos.title;
	const intro = translation?.photosIntro ?? "";

	const photos: BookPhoto[] =
		access.state === "open"
			? (
					await db.photo.findMany({
						where: { hiddenAt: null },
						orderBy: { createdAt: "asc" },
						select: { id: true, url: true, uploaderName: true, caption: true },
					})
				).map((photo) => ({ ...photo }))
			: [];

	return (
		<main
			lang={locale}
			dir={localeDefinition.dir}
			data-theme={dataTheme[theme]}
			className="mx-auto flex min-h-screen max-w-5xl flex-col items-center gap-10 px-4 py-12 sm:px-6"
		>
			<header className="flex flex-col items-center gap-2 text-center">
				<p className="text-xs uppercase tracking-[0.3em] text-ink/50">{coupleNames}</p>
				<h1 className="text-3xl font-medium sm:text-4xl">{title}</h1>
			</header>

			{access.state === "closed" ? (
				<section className="flex max-w-md flex-col items-center gap-3 rounded-2xl bg-ivory-dark/60 p-8 text-center ring-1 ring-ink/10">
					<h2 className="text-xl">{dictionary.photos.closedHeading}</h2>
					<p className="text-sm text-ink/70">
						{t(dictionary.photos.closedBody, { date: formatDate(access.opensAt, locale) })}
					</p>
				</section>
			) : (
				<>
					<PhotoUpload
						token={token}
						guestNames={invitation.guests.map((guest) => guest.firstName).filter(Boolean)}
						uploadsConfigured={isBlobConfigured()}
						copy={dictionary.photos}
					/>
					<PhotoBook
						pages={buildBookPages(photos, intro.trim().length > 0)}
						coupleNames={coupleNames}
						title={title}
						intro={intro}
						photoCount={photos.length}
						copy={dictionary.photos}
					/>
				</>
			)}

			<Link href={`/rsvp/${token}`} className="text-sm text-green underline underline-offset-4">
				{dictionary.photos.backToInvitation}
			</Link>
		</main>
	);
}
