import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { SETTINGS_SECTIONS } from "@/app/admin/settings/sections";
import { SettingsForm } from "@/app/admin/settings/settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveWeddingDate } from "@/domain/wedding-date";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { toWireDateOrEmpty } from "@/lib/wire-date";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
	await requireAdmin();
	const [settings, events] = await Promise.all([
		db.settings.findUnique({ where: { id: 1 } }),
		db.event.findMany({ orderBy: { startsAt: "asc" }, select: { startsAt: true } }),
	]);
	const derivedWeddingDate = resolveWeddingDate(settings?.weddingDate, events);

	return (
		<div className="flex flex-col gap-8">
			<h1 className="text-2xl font-medium">Settings</h1>
			<SettingsForm
				initialTimeZone={settings?.timeZone ?? "UTC"}
				initialWeddingInstant={settings?.weddingDate?.toISOString() ?? ""}
				initialDeadlineInstant={settings?.rsvpDeadline?.toISOString() ?? ""}
				initialCoupleNames={settings?.coupleNames ?? ""}
				initialWeddingDate={toWireDateOrEmpty(settings?.weddingDate, settings?.timeZone)}
				initialRsvpDeadline={toWireDateOrEmpty(settings?.rsvpDeadline, settings?.timeZone)}
				initialReplyTo={settings?.replyTo ?? ""}
				derivedWeddingDate={
					derivedWeddingDate.source === "derived"
						? toWireDateOrEmpty(derivedWeddingDate.date, settings?.timeZone)
						: ""
				}
			/>
			<div className="grid gap-4 sm:grid-cols-2">
				{SETTINGS_SECTIONS.map((section) => (
					<Link key={section.href} href={section.href}>
						<Card className="transition-colors hover:bg-accent">
							<CardHeader>
								<CardTitle className="flex items-center justify-between text-base">
									{section.label}
									<ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
								</CardTitle>
							</CardHeader>
							<CardContent className="text-sm text-muted-foreground">
								{section.description}
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
