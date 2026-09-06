"use client";

import { useState } from "react";
import { updateSettings } from "@/app/admin/settings/actions";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SettingsFormProps = {
	initialCoupleNames: string;
	initialRsvpDeadline: string;
	initialReplyTo: string;
};

export function SettingsForm({
	initialCoupleNames,
	initialRsvpDeadline,
	initialReplyTo,
}: SettingsFormProps) {
	const [coupleNames, setCoupleNames] = useState(initialCoupleNames);
	const [rsvpDeadline, setRsvpDeadline] = useState(initialRsvpDeadline);
	const [replyTo, setReplyTo] = useState(initialReplyTo);

	const { status, error, retry } = useAutosave({
		value: { coupleNames, rsvpDeadline, replyTo },
		save: updateSettings,
	});

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
						<Label htmlFor="rsvpDeadline">RSVP deadline</Label>
						<Input
							id="rsvpDeadline"
							type="datetime-local"
							value={rsvpDeadline}
							onChange={(event) => setRsvpDeadline(event.target.value)}
						/>
					</div>
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
