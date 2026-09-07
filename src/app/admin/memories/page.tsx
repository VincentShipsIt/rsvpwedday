import { MemoriesForm } from "@/app/admin/memories/memories-form";
import { PhotoModeration } from "@/app/admin/memories/photo-moderation";
import { resolvePhotoBookAccess } from "@/domain/photo-book";
import { localeCodes } from "@/i18n/locales";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// `datetime-local` wants `YYYY-MM-DDTHH:mm` in no particular zone; the stored instant is rendered
// in the server's zone, which is the same one `updateMemories` reads it back in.
function toDateTimeLocal(value: Date | null | undefined): string {
	if (!value) {
		return "";
	}
	const offsetMs = value.getTimezoneOffset() * 60_000;
	return new Date(value.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default async function MemoriesPage() {
	const [siteContent, photos, firstEvent] = await Promise.all([
		db.siteContent.findUnique({ where: { id: 1 }, include: { translations: true } }),
		db.photo.findMany({
			orderBy: { createdAt: "desc" },
			include: { invitation: { select: { email: true } } },
		}),
		db.event.findFirst({ orderBy: { startsAt: "asc" }, select: { startsAt: true } }),
	]);

	const access = resolvePhotoBookAccess(
		{
			enabled: siteContent?.photosEnabled ?? false,
			openAt: siteContent?.photosOpenAt ?? null,
			testMode: siteContent?.photosTestMode ?? false,
		},
		new Date()
	);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-medium">Memories</h1>
				<p className="text-sm text-muted-foreground">
					Guests add photos from their own invitation link, and everyone&apos;s photos appear in one
					page-turning book. Nothing exists until you switch it on, and uploads stay closed until
					the date you set.
				</p>
			</div>
			<MemoriesForm
				initialEnabled={siteContent?.photosEnabled ?? false}
				initialOpenAt={toDateTimeLocal(siteContent?.photosOpenAt)}
				initialTestMode={siteContent?.photosTestMode ?? false}
				firstEventStartsAt={toDateTimeLocal(firstEvent?.startsAt)}
				initialTranslations={localeCodes.map((locale) => {
					const stored = siteContent?.translations.find(
						(translation) => translation.locale === locale
					);
					return {
						locale,
						photosTitle: stored?.photosTitle ?? "",
						photosIntro: stored?.photosIntro ?? "",
					};
				})}
			/>
			<PhotoModeration
				isBookOpen={access.state === "open"}
				photos={photos.map((photo) => ({
					id: photo.id,
					url: photo.url,
					uploaderName: photo.uploaderName,
					caption: photo.caption,
					household: photo.invitation.email,
					createdAt: photo.createdAt.toISOString(),
					isHidden: photo.hiddenAt !== null,
				}))}
			/>
		</div>
	);
}
