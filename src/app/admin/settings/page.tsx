import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { SETTINGS_SECTIONS } from "@/app/admin/settings/sections";
import { SettingsForm } from "@/app/admin/settings/settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function toDateTimeLocal(date: Date): string {
	return date.toISOString().slice(0, 16);
}

export default async function SettingsPage() {
	const settings = await db.settings.findUnique({ where: { id: 1 } });

	return (
		<div className="flex flex-col gap-8">
			<h1 className="text-2xl font-medium">Settings</h1>
			<SettingsForm
				initialCoupleNames={settings?.coupleNames ?? ""}
				initialRsvpDeadline={settings ? toDateTimeLocal(settings.rsvpDeadline) : ""}
				initialReplyTo={settings?.replyTo ?? ""}
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
