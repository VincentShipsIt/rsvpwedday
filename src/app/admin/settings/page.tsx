import { SettingsForm } from "@/app/admin/settings/settings-form";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function toDateTimeLocal(date: Date): string {
	return date.toISOString().slice(0, 16);
}

export default async function SettingsPage() {
	const settings = await db.settings.findUnique({ where: { id: 1 } });

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-medium">Settings</h1>
			<SettingsForm
				initialCoupleNames={settings?.coupleNames ?? ""}
				initialRsvpDeadline={settings ? toDateTimeLocal(settings.rsvpDeadline) : ""}
				initialReplyTo={settings?.replyTo ?? ""}
			/>
		</div>
	);
}
