"use client";

import { format } from "date-fns";
import { useState } from "react";
import { updateSettings } from "@/app/admin/settings/actions";
import { DateTimeField } from "@/components/admin/date-time-field";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseWireDate } from "@/lib/wire-date";

export type SettingsFormProps = {
	initialCoupleNames: string;
	initialWeddingDate: string;
	initialRsvpDeadline: string;
	initialReplyTo: string;
	/** What the countdown is falling back to while no wedding date is set; empty once it is. */
	derivedWeddingDate: string;
};

export function SettingsForm({
	initialCoupleNames,
	initialWeddingDate,
	initialRsvpDeadline,
	initialReplyTo,
	derivedWeddingDate,
}: SettingsFormProps) {
	const [coupleNames, setCoupleNames] = useState(initialCoupleNames);
	const [weddingDate, setWeddingDate] = useState(initialWeddingDate);
	const [rsvpDeadline, setRsvpDeadline] = useState(initialRsvpDeadline);
	const [replyTo, setReplyTo] = useState(initialReplyTo);

	const { status, error, retry } = useAutosave({
		value: { coupleNames, weddingDate, rsvpDeadline, replyTo },
		save: updateSettings,
	});

	const fallback = parseWireDate(derivedWeddingDate);

	return (
		<div className="flex flex-col gap-8">
			<Card>
				<CardHeader>
					<CardTitle>Wedding details</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="coupleNames">Couple names</Label>
						<Input
							id="coupleNames"
							value={coupleNames}
							onChange={(event) => setCoupleNames(event.target.value)}
						/>
					</div>
					<DateTimeField
						label="Wedding date"
						value={weddingDate}
						onChange={setWeddingDate}
						clearable
						description={
							weddingDate
								? "What the countdown counts to. Events keep their own dates — some can fall before or after this day."
								: fallback
									? `Not set, so the countdown is using your earliest event: ${format(fallback, "EEEE d MMMM yyyy")}. Set the day itself to be sure.`
									: "Not set, and there are no events yet, so the countdown has nothing to count to."
						}
					/>
					<DateTimeField label="RSVP deadline" value={rsvpDeadline} onChange={setRsvpDeadline} />
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="replyTo">Reply-to contact</Label>
						<Input
							id="replyTo"
							value={replyTo}
							onChange={(event) => setReplyTo(event.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			<div className="flex items-center gap-3">
				<Button type="button" variant="secondary" disabled={status === "saving"} onClick={retry}>
					Save now
				</Button>
				<SaveStatus status={status} error={error} onRetry={retry} />
			</div>
		</div>
	);
}
