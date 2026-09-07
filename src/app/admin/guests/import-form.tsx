"use client";

import { type ChangeEvent, useMemo, useState, useTransition } from "react";
import { commitImport } from "@/app/admin/guests/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { IMPORT_CSV_HEADER, IMPORT_EVENTS_SEPARATOR, parseImportCsv } from "@/domain/csv";

export function GuestsImportForm({
	eventSlugs,
	onImported,
}: {
	eventSlugs: string[];
	/** Closes the dialog and refreshes the list once the rows have landed. */
	onImported?: () => void;
}) {
	const [text, setText] = useState(`${IMPORT_CSV_HEADER.join(",")}\n`);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const preview = useMemo(() => parseImportCsv(text, { eventSlugs }), [text, eventSlugs]);

	async function handleFile(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}
		setText(await file.text());
	}

	function handleCommit() {
		setError(null);
		startTransition(async () => {
			const result = await commitImport(text);
			if (!result.ok) {
				setError(result.error);
				return;
			}
			onImported?.();
		});
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="guests-csv-file">Upload the filled template</Label>
				<Input id="guests-csv-file" type="file" accept=".csv,text/csv" onChange={handleFile} />
			</div>
			<Textarea
				className="h-48 font-mono text-xs"
				value={text}
				onChange={(event) => setText(event.target.value)}
			/>

			{preview.errors.length > 0 && (
				<ul className="list-inside list-disc text-sm text-destructive">
					{preview.errors.map((rowError) => (
						<li key={rowError}>{rowError}</li>
					))}
				</ul>
			)}

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Email</TableHead>
						<TableHead>Locale</TableHead>
						<TableHead>Allowance</TableHead>
						<TableHead>Guests</TableHead>
						<TableHead>Events</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{preview.invitations.map((invitation) => (
						<TableRow key={invitation.email}>
							<TableCell>{invitation.email}</TableCell>
							<TableCell>{invitation.locale}</TableCell>
							<TableCell>{invitation.companionAllowance}</TableCell>
							<TableCell>
								{invitation.guests
									.map((guest) => `${guest.firstName} ${guest.lastName}`)
									.join(", ")}
							</TableCell>
							<TableCell className="text-muted-foreground">
								{invitation.eventSlugs
									? invitation.eventSlugs.join(`${IMPORT_EVENTS_SEPARATOR} `)
									: "All events"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{error && <p className="text-sm text-destructive">{error}</p>}

			<Button
				type="button"
				disabled={isPending || preview.invitations.length === 0 || preview.errors.length > 0}
				onClick={handleCommit}
				className="self-start"
			>
				Import guests
			</Button>
		</div>
	);
}
