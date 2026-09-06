import { RsvpForm } from "@/app/admin/website/rsvp/rsvp-form";
import { WebsiteNav } from "@/app/admin/website/website-nav";
import { localeCodes } from "@/i18n/locales";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RsvpPage() {
	const siteContent = await db.siteContent.findUnique({
		where: { id: 1 },
		include: { translations: true },
	});

	return (
		<div className="flex flex-col gap-6">
			<WebsiteNav current="/admin/website/rsvp" />
			<h1 className="text-2xl font-medium">RSVP</h1>
			<RsvpForm
				initialTranslations={localeCodes.map((code) => ({
					locale: code,
					rsvpNote:
						siteContent?.translations.find((translation) => translation.locale === code)
							?.rsvpNote ?? "",
				}))}
			/>
		</div>
	);
}
