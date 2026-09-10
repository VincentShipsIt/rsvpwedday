import { Badge } from "@rsvpwedday/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@rsvpwedday/ui/hover-card";
import type { ReactNode } from "react";
import {
	type Couple,
	coupleStatusLabels,
	euro,
	type Provider,
	pipelineValue,
	providerKindLabels,
} from "@/lib/crm";

/*
 * A row in a table can only afford one line per column, so the things you
 * actually want before clicking — the note, the address, the money — have
 * nowhere to go. They go here, on hover, without costing a page load.
 */
function Shell({ children, card }: { children: ReactNode; card: ReactNode }) {
	return (
		<HoverCard openDelay={220} closeDelay={80}>
			<HoverCardTrigger asChild>{children}</HoverCardTrigger>
			<HoverCardContent className="w-80">{card}</HoverCardContent>
		</HoverCard>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-baseline justify-between gap-3">
			<dt className="text-muted-foreground shrink-0 text-[12px]">{label}</dt>
			<dd className="min-w-0 text-right text-[12px] text-pretty">{value}</dd>
		</div>
	);
}

export function ProviderHover({ provider, children }: { provider: Provider; children: ReactNode }) {
	const contact = [provider.contact.phone, provider.contact.email].filter(Boolean).join(" · ");
	return (
		<Shell
			card={
				<div className="flex flex-col gap-2.5">
					<div className="flex items-start justify-between gap-2">
						<p className="text-[13px] font-semibold">{provider.name}</p>
						<Badge variant="secondary" className="shrink-0 font-normal">
							{providerKindLabels[provider.kind]}
						</Badge>
					</div>
					{provider.notes ? <p className="text-[12px] text-pretty">{provider.notes}</p> : null}
					<dl className="flex flex-col gap-1 border-t pt-2">
						<Row label="Place" value={provider.place.label} />
						{provider.place.address ? <Row label="Address" value={provider.place.address} /> : null}
						{provider.capacity ? <Row label="Capacity" value={provider.capacity} /> : null}
						{provider.hours ? <Row label="Hours" value={provider.hours} /> : null}
						{contact ? <Row label="Contact" value={contact} /> : null}
						{provider.contact.whatsapp ? (
							<Row label="WhatsApp" value={provider.contact.whatsapp} />
						) : null}
					</dl>
					{provider.tags.length > 0 ? (
						<p className="text-muted-foreground text-[11px]">{provider.tags.join(" · ")}</p>
					) : null}
				</div>
			}
		>
			{children}
		</Shell>
	);
}

export function CoupleHover({ couple, children }: { couple: Couple; children: ReactNode }) {
	const contact = [couple.contact.email, couple.contact.whatsapp].filter(Boolean).join(" · ");
	return (
		<Shell
			card={
				<div className="flex flex-col gap-2.5">
					<div className="flex items-start justify-between gap-2">
						<p className="text-[13px] font-semibold">{couple.couple}</p>
						<Badge variant="secondary" className="shrink-0 font-normal">
							{coupleStatusLabels[couple.status]}
						</Badge>
					</div>
					{couple.notes ? <p className="text-[12px] text-pretty">{couple.notes}</p> : null}
					<dl className="flex flex-col gap-1 border-t pt-2">
						<Row label="Place" value={couple.place.label} />
						{couple.date ? <Row label="Date" value={couple.date} /> : null}
						{couple.fee ? <Row label="Fee" value={euro.format(couple.fee)} /> : null}
						{couple.budget ? <Row label="Budget" value={euro.format(couple.budget)} /> : null}
						{pipelineValue(couple) ? (
							<Row label="Pipeline" value={euro.format(pipelineValue(couple))} />
						) : null}
						{contact ? <Row label="Contact" value={contact} /> : null}
						{couple.source ? <Row label="Source" value={couple.source} /> : null}
					</dl>
					{couple.providerIds.length > 0 ? (
						<p className="text-muted-foreground text-[11px]">
							{couple.providerIds.length} provider
							{couple.providerIds.length === 1 ? "" : "s"} booked
						</p>
					) : null}
				</div>
			}
		>
			{children}
		</Shell>
	);
}
