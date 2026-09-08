"use client";

import { type ChangeEvent, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { commitImport, type ImportSummary, reviewImport } from "@/app/admin/guests/actions";
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
import { EDITABLE_IMPORT_CSV_HEADER, IMPORT_EVENTS_SEPARATOR, parseImportCsv } from "@/domain/csv";

export function GuestsImportForm({
	eventSlugs,
	onImported,
}: {
	eventSlugs: string[];
	/** Closes the dialog and refreshes the list once the rows have landed. */
	onImported?: () => void;
}) {
	const [text, setText] = useState(`${EDITABLE_IMPORT_CSV_HEADER.join(",")}\n`);
	const [review, setReview] = useState<{ fingerprint: string; summary: ImportSummary } | null>(
		null
	);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const preview = useMemo(() => parseImportCsv(text, { eventSlugs }), [text, eventSlugs]);

	async function handleFile(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}
		setReview(null);
		setError(null);
		setText(await file.text());
	}

	function handleReview() {
		setError(null);
		startTransition(async () => {
			try {
				const result = await reviewImport(text);
				if (!result.ok) {
					setError(result.error);
					return;
				}
				setReview({ fingerprint: result.fingerprint, summary: result.summary });
			} catch {
				setError("Could not review the CSV. Try again.");
			}
		});
	}

	function handleCommit() {
		if (!review) return;
		setError(null);
		startTransition(async () => {
			try {
				const result = await commitImport(text, review.fingerprint);
				if (!result.ok) {
					setError(result.error);
					setReview(null);
					return;
				}
				toast.success(
					`Imported ${result.summary.newHouseholds} new households; merged ${result.summary.existingHouseholds} existing households. ${result.summary.addedGuests} guests added, ${result.summary.updatedGuests} updated.`
				);
				setReview(null);
				onImported?.();
			} catch {
				setError("Could not import the CSV. Review again before retrying.");
				setReview(null);
			}
		});
	}

	return (
		<div className="flex flex-col gap-6">
			<p className="text-sm text-muted-foreground">
				Imports merge into existing households. Missing guests, companions, dietary details and
				replies are kept. Use guestId when changing a name; blank contact details keep the existing
				contact. Event membership changes apply to everyone in the household and are reviewed below.
			</p>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="guests-csv-file">Upload the filled template</Label>
				<Input
					id="guests-csv-file"
					type="file"
					accept=".csv,text/csv"
					onChange={handleFile}
					disabled={isPending}
				/>
			</div>
			<Label htmlFor="guests-csv-text">CSV contents</Label>
			<Textarea
				id="guests-csv-text"
				disabled={isPending}
				aria-describedby={error ? "guests-csv-error" : undefined}
				className="h-48 font-mono text-xs"
				value={text}
				onChange={(event) => {
					setText(event.target.value);
					setReview(null);
					setError(null);
				}}
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
						<TableHead>Children under 12</TableHead>
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
							<TableCell>{invitation.childrenUnder12 ?? "Keep existing"}</TableCell>
							<TableCell className="text-muted-foreground">
								{invitation.eventSlugs
									? invitation.eventSlugs.join(`${IMPORT_EVENTS_SEPARATOR} `)
									: "All events"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{error && (
				<p id="guests-csv-error" role="alert" className="text-sm text-destructive">
					{error}
				</p>
			)}

			{review && (
				<div className="rounded-lg border p-4 text-sm" role="status">
					<p>
						{review.summary.newHouseholds} new households; {review.summary.existingHouseholds}{" "}
						existing households to merge.
					</p>
					<p>
						{review.summary.addedGuests} guests added, {review.summary.updatedGuests} updated,{" "}
						{review.summary.unchangedGuests} unchanged, {review.summary.retainedGuests} omitted
						guests retained.
					</p>
					{review.summary.repliesNeeded > 0 && (
						<p>
							{review.summary.repliesNeeded} households will need a new reply for added guests,
							events or children. Existing answers stay saved.
						</p>
					)}
					{(review.summary.removedMemberships > 0 || review.summary.removedChildAttendance > 0) && (
						<p className="mt-2 font-medium text-destructive">
							This removes {review.summary.removedMemberships} guest event invitations, including{" "}
							{review.summary.removedResponses} saved responses, and reduces attending-child totals
							by {review.summary.removedChildAttendance} across the affected events. Confirm only if
							these event and child-count changes are intended.
						</p>
					)}
				</div>
			)}

			<Button
				type="button"
				disabled={isPending || preview.invitations.length === 0 || preview.errors.length > 0}
				onClick={review ? handleCommit : handleReview}
				className="self-start"
			>
				{isPending ? "Working…" : review ? "Import reviewed changes" : "Review changes"}
			</Button>
		</div>
	);
}
