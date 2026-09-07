import { DownloadIcon } from "lucide-react";
import { GuestsImportForm } from "@/app/admin/guests/import-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IMPORT_EVENTS_SEPARATOR } from "@/domain/csv";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GuestsPage() {
	const events = await db.event.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true } });
	const eventSlugs = events.map((event) => event.slug);

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-medium">Guests</h1>

			<Card>
				<CardHeader>
					<CardTitle>Import</CardTitle>
					<CardDescription>
						Download the template, fill one row per guest, then upload it or paste it below. Rows
						sharing an email become one invitation. Re-importing an existing email replaces that
						invitation&apos;s guests.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="flex flex-wrap items-center gap-3">
						<Button asChild variant="secondary">
							<a href="/admin/guests/template">
								<DownloadIcon />
								Download template
							</a>
						</Button>
						<p className="text-sm text-muted-foreground">
							<span className="font-medium text-foreground">events</span> column: the events this
							household is invited to, separated by &ldquo;{IMPORT_EVENTS_SEPARATOR}&rdquo;. Leave
							it empty to invite them to everything. Valid values:{" "}
							{eventSlugs.length > 0 ? (
								eventSlugs.map((slug) => (
									<code key={slug} className="mr-1 rounded bg-muted px-1 py-0.5 text-xs">
										{slug}
									</code>
								))
							) : (
								<span>none yet, add events under Website first</span>
							)}
						</p>
					</div>
					<GuestsImportForm eventSlugs={eventSlugs} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Export</CardTitle>
					<CardDescription>
						Downloads every guest as CSV: invitationEmail, status, firstName, lastName, kind,
						dietary, and one column per event slug with each guest&apos;s attendance. An empty event
						cell means the guest was not invited to it.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button asChild>
						<a href="/admin/export">
							<DownloadIcon />
							Download guests.csv
						</a>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
