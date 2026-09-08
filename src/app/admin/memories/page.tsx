import { MemoriesForm } from "@/app/admin/memories/memories-form";
import { PhotoModeration } from "@/app/admin/memories/photo-moderation";
import { resolvePhotoBookAccess } from "@/domain/photo-book";
import { resolveWeddingDate } from "@/domain/wedding-date";
import { localeCodes } from "@/i18n/locales";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { toWireDateOrEmpty } from "@/lib/wire-date";

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
	await requireAdmin();
	const [siteContent, photos, settings, events, pendingCleanup] = await Promise.all([
		db.siteContent.findUnique({ where: { id: 1 }, include: { translations: true } }),
		db.photo.findMany({
			orderBy: { createdAt: "desc" },
			include: { invitation: { select: { email: true } } },
		}),
		db.settings.findUnique({ where: { id: 1 }, select: { weddingDate: true, timeZone: true } }),
		db.event.findMany({ orderBy: { startsAt: "asc" }, select: { startsAt: true } }),
		db.mediaCleanup.count({ where: { completedAt: null } }),
	]);

	const wedding = resolveWeddingDate(settings?.weddingDate, events);

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
				timeZone={settings?.timeZone ?? "UTC"}
				initialEnabled={siteContent?.photosEnabled ?? false}
				initialOpenAt={toWireDateOrEmpty(siteContent?.photosOpenAt, settings?.timeZone ?? "UTC")}
				initialTestMode={siteContent?.photosTestMode ?? false}
				weddingDate={toWireDateOrEmpty(wedding.date, settings?.timeZone ?? "UTC")}
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
				pendingCleanup={pendingCleanup}
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
