"use client";

import { TableRow } from "@rsvpwedday/ui/table";
import type { ReactNode } from "react";
import { type RecordPanel, useRail } from "@/components/right-rail";

/*
 * Clicking the row opens that record in the right rail; clicking the name still
 * navigates to the full page, and so does any other link or button inside a
 * cell — hence the bail-out on the nearest interactive ancestor rather than
 * stopPropagation scattered across every cell. Shared by providers and couples
 * so the two tables cannot drift apart.
 */
export function RecordRow({ panel, children }: { panel: RecordPanel; children: ReactNode }) {
	const { openRecord } = useRail();

	return (
		<TableRow
			tabIndex={0}
			className="cursor-pointer"
			onClick={(event) => {
				if ((event.target as HTMLElement).closest("a,button,input,select")) return;
				openRecord(panel);
			}}
			onKeyDown={(event) => {
				if (event.target !== event.currentTarget) return;
				if (event.key !== "Enter" && event.key !== " ") return;
				event.preventDefault();
				openRecord(panel);
			}}
		>
			{children}
		</TableRow>
	);
}
