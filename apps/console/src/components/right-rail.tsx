"use client";

import { Button } from "@rsvpwedday/ui/button";
import { PanelRightCloseIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { AgentChat } from "@/components/agent-chat";

const STORAGE_KEY = "sayyes.console.agent-rail";

export type RecordPanel = {
	title: string;
	subtitle?: string;
	badge?: string;
	note?: string;
	rows: Array<{ label: string; value: string }>;
	tags?: string[];
	href: string;
	/* Built on the server so the client never has to read map env vars. */
	mapSrc?: string | null;
	mapHref?: string | null;
};

type Rail = {
	panel: "agent" | "record" | null;
	record: RecordPanel | null;
	toggleAgent: () => void;
	openRecord: (record: RecordPanel) => void;
	close: () => void;
};

const RailContext = createContext<Rail>({
	panel: null,
	record: null,
	toggleAgent: () => {},
	openRecord: () => {},
	close: () => {},
});

export function useRail(): Rail {
	return useContext(RailContext);
}

/*
 * One rail, two things it can hold. The agent is the resting state; clicking a
 * row borrows the same slot to show that record, so the studio never has more
 * than one panel competing for the right-hand side.
 */
export function RailProvider({ children }: { children: ReactNode }) {
	const [panel, setPanel] = useState<"agent" | "record" | null>(null);
	const [record, setRecord] = useState<RecordPanel | null>(null);

	useEffect(() => {
		try {
			if (window.localStorage.getItem(STORAGE_KEY) !== "closed") setPanel("agent");
		} catch {
			setPanel("agent");
		}
	}, []);

	function remember(next: "agent" | null) {
		try {
			window.localStorage.setItem(STORAGE_KEY, next === "agent" ? "open" : "closed");
		} catch {
			// a browser with site data blocked still gets a working rail
		}
	}

	const value: Rail = {
		panel,
		record,
		toggleAgent: () => {
			const next = panel === "agent" ? null : "agent";
			setPanel(next);
			remember(next);
		},
		openRecord: (next) => {
			setRecord(next);
			setPanel("record");
		},
		close: () => {
			setPanel(null);
			remember(null);
		},
	};

	return <RailContext value={value}>{children}</RailContext>;
}

export function AgentToggle() {
	const { panel, toggleAgent } = useRail();
	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={toggleAgent}
			aria-expanded={panel === "agent"}
			aria-controls="right-rail"
			className="text-muted-foreground h-7 gap-1.5 px-2 text-[12px]"
		>
			<SparklesIcon className="size-3.5" aria-hidden="true" />
			Agent
		</Button>
	);
}

function RailHeader({ title, onClose }: { title: ReactNode; onClose: () => void }) {
	return (
		<header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b px-3">
			<p className="flex min-w-0 items-center gap-2 truncate text-[13px] font-medium">{title}</p>
			<Button
				variant="ghost"
				size="icon"
				onClick={onClose}
				className="text-muted-foreground size-7 shrink-0"
			>
				<PanelRightCloseIcon className="size-4" aria-hidden="true" />
				<span className="sr-only">Close the panel</span>
			</Button>
		</header>
	);
}

export function RightRail() {
	const { panel, record, close } = useRail();
	if (!panel) return null;

	return (
		<aside
			id="right-rail"
			aria-label={panel === "agent" ? "Agent" : "Record"}
			className="bg-muted/40 flex min-h-0 shrink-0 flex-col border-t md:h-dvh md:w-80 md:border-t-0 md:border-l lg:w-96"
		>
			{panel === "agent" ? (
				<>
					<RailHeader
						title={
							<>
								<SparklesIcon className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
								Agent
							</>
						}
						onClose={close}
					/>
					<AgentChat />
				</>
			) : record ? (
				<>
					<RailHeader title={record.title} onClose={close} />
					<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3">
						{record.mapSrc ? (
							<iframe
								title={`Map of ${record.title}`}
								src={record.mapSrc}
								className="h-40 w-full rounded-md border-0 ring-1 ring-foreground/10"
								loading="lazy"
								referrerPolicy="no-referrer-when-downgrade"
							/>
						) : null}

						<div className="flex flex-col gap-1">
							<p className="text-[15px] font-semibold">{record.title}</p>
							{record.subtitle ? (
								<p className="text-muted-foreground text-[12px]">{record.subtitle}</p>
							) : null}
						</div>

						{record.note ? <p className="text-[13px] text-pretty">{record.note}</p> : null}

						{record.rows.length > 0 ? (
							<dl className="flex flex-col gap-1.5 border-t pt-3">
								{record.rows.map((row) => (
									<div key={row.label} className="flex items-baseline justify-between gap-3">
										<dt className="text-muted-foreground shrink-0 text-[12px]">{row.label}</dt>
										<dd className="min-w-0 text-right text-[12px] text-pretty">{row.value}</dd>
									</div>
								))}
							</dl>
						) : null}

						{record.tags && record.tags.length > 0 ? (
							<p className="text-muted-foreground text-[11px]">{record.tags.join(" · ")}</p>
						) : null}

						<div className="mt-auto flex flex-col gap-2 pt-3">
							<Button asChild size="sm">
								<Link href={record.href}>Open the full record</Link>
							</Button>
							{record.mapHref ? (
								<Button asChild size="sm" variant="outline">
									<a href={record.mapHref} target="_blank" rel="noreferrer">
										Open in Google Maps
									</a>
								</Button>
							) : null}
						</div>
					</div>
				</>
			) : null}
		</aside>
	);
}
