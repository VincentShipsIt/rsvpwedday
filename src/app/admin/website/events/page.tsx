import { EventsForm } from "@/app/admin/website/events/events-form";
import { headingDefaults, initialHeadings } from "@/app/admin/website/section-headings";
import { WebsiteNav } from "@/app/admin/website/website-nav";
import { localeCodes } from "@/i18n/locales";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function toDateTimeLocal(date: Date): string {
	return date.toISOString().slice(0, 16);
}

export default async function EventsPage() {
	const [events, siteContent] = await Promise.all([
		db.event.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
		db.siteContent.findUnique({ where: { id: 1 }, include: { translations: true } }),
	]);

	return (
		<div className="flex flex-col gap-6">
			<WebsiteNav current="/admin/website/events" />
			<h1 className="text-2xl font-medium">Events</h1>
			<EventsForm
				initialHeadings={initialHeadings(siteContent?.translations, "eventsHeading")}
				headingDefaults={headingDefaults("eventsHeading")}
				initialEvents={events.map((event) => ({
					id: event.id,
					slug: event.slug,
					startsAt: toDateTimeLocal(event.startsAt),
					endsAt: event.endsAt ? toDateTimeLocal(event.endsAt) : "",
					venue: event.venue,
					address: event.address,
					mapsUrl: event.mapsUrl ?? "",
					dressCode: event.dressCode ?? "",
					sortOrder: event.sortOrder,
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
