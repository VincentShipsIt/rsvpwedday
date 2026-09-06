"use client";

import { useMemo, useState, useTransition } from "react";
import { commitImport } from "@/app/admin/guests/actions";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { IMPORT_CSV_HEADER, parseImportCsv } from "@/domain/csv";

export function GuestsImportForm() {
	const [text, setText] = useState(`${IMPORT_CSV_HEADER.join(",")}\n`);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const preview = useMemo(() => parseImportCsv(text), [text]);

	function handleCommit() {
		setError(null);
		startTransition(async () => {
			const result = await commitImport(text);
			if (!result.ok) {
				setError(result.error);
			}
		});
	}

	return (
		<div className="flex flex-col gap-6">
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
