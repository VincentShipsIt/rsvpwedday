"use client";

import { useRef, useState } from "react";
import { updateSettings } from "@/app/admin/settings/actions";
import { DateTimeField } from "@/components/admin/date-time-field";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isTimeZone, parseWireDate, parseWireDatePreserving, toWireDate } from "@/lib/wire-date";

export type SettingsFormProps = {
	initialCoupleNames: string;
	initialTimeZone: string;
	initialWeddingInstant: string;
	initialDeadlineInstant: string;
	initialWeddingDate: string;
	initialRsvpDeadline: string;
	initialReplyTo: string;
	/** What the countdown is falling back to while no wedding date is set; empty once it is. */
	derivedWeddingDate: string;
};

export function SettingsForm({
	initialCoupleNames,
	initialTimeZone,
	initialWeddingInstant,
	initialDeadlineInstant,
	initialWeddingDate,
	initialRsvpDeadline,
	initialReplyTo,
	derivedWeddingDate,
}: SettingsFormProps) {
	const weddingInstant = useRef(initialWeddingInstant ? new Date(initialWeddingInstant) : null);
	const deadlineInstant = useRef(initialDeadlineInstant ? new Date(initialDeadlineInstant) : null);
	const [timeZone, setTimeZone] = useState(initialTimeZone);
	const [zoneInput, setZoneInput] = useState(initialTimeZone);
	const [coupleNames, setCoupleNames] = useState(initialCoupleNames);
	const [weddingDate, setWeddingDate] = useState(initialWeddingDate);
	const [rsvpDeadline, setRsvpDeadline] = useState(initialRsvpDeadline);
	const [replyTo, setReplyTo] = useState(initialReplyTo);

	const { status, error, retry } = useAutosave({
		value: { coupleNames, weddingDate, rsvpDeadline, replyTo, timeZone },
		save: updateSettings,
	});

	const fallback = parseWireDate(derivedWeddingDate, initialTimeZone);
	function changeTimeZone(next: string) {
		setZoneInput(next);
		if (!isTimeZone(next)) return;
		const wedding = parseWireDatePreserving(weddingDate, timeZone, weddingInstant.current);
		weddingInstant.current = wedding;
		const deadline = parseWireDatePreserving(rsvpDeadline, timeZone, deadlineInstant.current);
		deadlineInstant.current = deadline;
		if (wedding) setWeddingDate(toWireDate(wedding, next));
		if (deadline) setRsvpDeadline(toWireDate(deadline, next));
		setTimeZone(next);
	}

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
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="timeZone">Wedding timezone</Label>
						<Input
							id="timeZone"
							value={zoneInput}
							onChange={(event) => changeTimeZone(event.target.value)}
							aria-invalid={!isTimeZone(zoneInput)}
							aria-describedby="timezone-help"
						/>
						<p id="timezone-help" className="text-xs text-muted-foreground">
							Use an IANA timezone such as Europe/Berlin. Changing it preserves existing event
							instants and updates their displayed local times. During an autumn clock change,
							repeated times use the first occurrence.
						</p>
						{!isTimeZone(zoneInput) && (
							<p role="alert" className="text-sm text-destructive">
								Enter a valid timezone before it can be saved.
							</p>
						)}
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
									? `Not set, so the countdown is using your earliest event: ${new Intl.DateTimeFormat("en", { dateStyle: "full", timeZone }).format(fallback)}. Set the day itself to be sure.`
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
