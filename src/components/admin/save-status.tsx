"use client";

import type { AutosaveStatus } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";

export type SaveStatusProps = {
	status: AutosaveStatus;
	error: string | null;
	onRetry: () => void;
};

// Quiet autosave indicator rendered next to the "Save now" fallback button on every
// autosaving admin form. Idle and pending render nothing — there is nothing worth reporting
// until a save is actually in flight.
export function SaveStatus({ status, error, onRetry }: SaveStatusProps) {
	if (status === "idle" || status === "pending") {
		return null;
	}

	if (status === "saving") {
		return <p className="text-sm text-muted-foreground">Saving…</p>;
	}

	if (status === "error") {
		return (
			<div className="flex items-center gap-2">
				<p className="text-sm text-destructive">{error ?? "Couldn't save."}</p>
				<Button type="button" variant="ghost" size="sm" onClick={onRetry}>
					Retry
				</Button>
			</div>
		);
	}

	return <p className="text-sm text-muted-foreground">Saved</p>;
}
