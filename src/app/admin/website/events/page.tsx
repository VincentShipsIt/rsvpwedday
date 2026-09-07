import { EventsForm } from "@/app/admin/website/events/events-form";
import { WebsiteNav } from "@/app/admin/website/website-nav";
import { localeCodes } from "@/i18n/locales";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function toDateTimeLocal(date: Date): string {
	return date.toISOString().slice(0, 16);
}

export default async function EventsPage() {
	const events = await db.event.findMany({
		orderBy: { sortOrder: "asc" },
		include: { translations: true },
	});

	return (
		<div className="flex flex-col gap-6">
			<WebsiteNav current="/admin/website/events" />
			<h1 className="text-2xl font-medium">Events</h1>
			<p className="text-sm text-muted-foreground">
				The first event&apos;s start date is the wedding date: it drives the date on the hero, the
				countdown, and the calendar files guests download.
			</p>
			<EventsForm
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
