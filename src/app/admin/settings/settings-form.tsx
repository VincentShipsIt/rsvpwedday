"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSettings } from "@/app/admin/settings/actions";
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
	const router = useRouter();
	const [coupleNames, setCoupleNames] = useState(initialCoupleNames);
	const [rsvpDeadline, setRsvpDeadline] = useState(initialRsvpDeadline);
	const [replyTo, setReplyTo] = useState(initialReplyTo);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	function handleSave() {
		setError(null);

		startTransition(async () => {
			const result = await updateSettings({ coupleNames, rsvpDeadline, replyTo });
			if (!result.ok) {
				setError(result.error);
				return;
			}
			toast.success("Settings saved");
			router.refresh();
		});
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

			{error && <p className="text-sm text-destructive">{error}</p>}

			<Button type="button" disabled={isPending} onClick={handleSave} className="self-start">
				Save settings
			</Button>
		</div>
	);
}
