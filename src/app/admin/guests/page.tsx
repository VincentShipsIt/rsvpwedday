import { DownloadIcon } from "lucide-react";
import { GuestsImportForm } from "@/app/admin/guests/import-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IMPORT_CSV_HEADER } from "@/domain/csv";

export default function GuestsPage() {
	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-medium">Guests</h1>

			<Card>
				<CardHeader>
					<CardTitle>Import</CardTitle>
					<CardDescription>
						Paste CSV rows: {IMPORT_CSV_HEADER.join(",")}. One row per guest; rows sharing an email
						merge into one invitation. Re-importing an existing email replaces that
						invitation&apos;s guests.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<GuestsImportForm />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Export</CardTitle>
					<CardDescription>
						Downloads every guest as CSV: invitationEmail, status, firstName, lastName, kind,
						dietary, and one column per event slug with each guest&apos;s attendance.
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
