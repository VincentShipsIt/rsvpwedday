import Link from "next/link";
import { EventsForm } from "@/app/admin/settings/events/events-form";
import { SettingsNav } from "@/app/admin/settings/settings-nav";
import { resolveWeddingDate } from "@/domain/wedding-date";
import { localeCodes } from "@/i18n/locales";
import { db } from "@/lib/db";
import { toWireDateOrEmpty } from "@/lib/wire-date";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
	const [events, settings] = await Promise.all([
		db.event.findMany({
			orderBy: { sortOrder: "asc" },
			include: { translations: true, _count: { select: { attendance: true } } },
		}),
		db.settings.findUnique({ where: { id: 1 }, select: { weddingDate: true, timeZone: true } }),
	]);
	const wedding = resolveWeddingDate(settings?.weddingDate, events);

	return (
		<div className="flex flex-col gap-6">
			<SettingsNav current="/admin/settings/events" />
			<h1 className="text-2xl font-medium">Events</h1>
			<p className="text-sm text-muted-foreground">
				Each event keeps its own date, so a henna night the evening before and a brunch the morning
				after are ordinary events. Every one is labelled against the wedding day, which is set under{" "}
				<Link href="/admin/settings" className="underline underline-offset-4">
					Settings
				</Link>
				.
			</p>
			<EventsForm
				timeZone={settings?.timeZone ?? "UTC"}
				weddingDate={toWireDateOrEmpty(wedding.date, settings?.timeZone)}
				initialEvents={events.map((event) => ({
					id: event.id,
					attendanceCount: event._count.attendance,
					slug: event.slug,
					startsAt: toWireDateOrEmpty(event.startsAt, settings?.timeZone),
					endsAt: toWireDateOrEmpty(event.endsAt, settings?.timeZone),
					venue: event.venue,
					address: event.address,
					mapsUrl: event.mapsUrl ?? "",
					dressCode: event.dressCode ?? "",
					sortOrder: event.sortOrder,
					showPublicly: event.showPublicly,
					translations: localeCodes.map((code) => {
						const translation = event.translations.find((candidate) => candidate.locale === code);
						return {
							locale: code,
							name: translation?.name ?? "",
							description: translation?.description ?? "",
						};
					}),
				}))}
			/>
		</div>
	);
}
