"use client";

import type { ChangeEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import { commitImport } from "@/app/admin/import/actions";
import { Button } from "@/components/button";
import { IMPORT_CSV_HEADER, parseImportCsv } from "@/domain/csv";

export function ImportForm() {
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
			<textarea
				className="h-48 w-full rounded-md border border-ink/15 bg-white p-3 font-mono text-xs"
				value={text}
				onChange={(changeEvent: ChangeEvent<HTMLTextAreaElement>) =>
					setText(changeEvent.target.value)
				}
			/>

			{preview.errors.length > 0 && (
				<ul className="list-inside list-disc text-sm text-red-700">
					{preview.errors.map((rowError) => (
						<li key={rowError}>{rowError}</li>
					))}
				</ul>
			)}

			<table className="w-full text-left text-sm">
				<thead>
					<tr>
						<th className="pb-2">Email</th>
						<th className="pb-2">Locale</th>
						<th className="pb-2">Allowance</th>
						<th className="pb-2">Guests</th>
					</tr>
				</thead>
				<tbody>
					{preview.invitations.map((invitation) => (
						<tr key={invitation.email} className="border-t border-ink/10">
							<td className="py-1">{invitation.email}</td>
							<td className="py-1">{invitation.locale}</td>
							<td className="py-1">{invitation.companionAllowance}</td>
							<td className="py-1">
								{invitation.guests
									.map((guest) => `${guest.firstName} ${guest.lastName}`)
									.join(", ")}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{error && <p className="text-sm text-red-700">{error}</p>}

			<Button
				type="button"
				disabled={isPending || preview.invitations.length === 0 || preview.errors.length > 0}
				onClick={handleCommit}
			>
				Commit import
			</Button>
		</div>
	);
}
