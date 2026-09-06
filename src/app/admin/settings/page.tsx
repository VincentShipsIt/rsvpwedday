import { SettingsForm } from "@/app/admin/settings/settings-form";
import { localeCodes } from "@/i18n/locales";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function toDateTimeLocal(date: Date): string {
	return date.toISOString().slice(0, 16);
}

export default async function SettingsPage() {
	const [settings, events] = await Promise.all([
		db.settings.findUnique({ where: { id: 1 } }),
		db.event.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
	]);

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-medium">Settings</h1>
			<SettingsForm
				initialCoupleNames={settings?.coupleNames ?? ""}
				initialRsvpDeadline={settings ? toDateTimeLocal(settings.rsvpDeadline) : ""}
				initialReplyTo={settings?.replyTo ?? ""}
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
