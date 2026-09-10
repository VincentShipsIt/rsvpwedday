import { Button } from "@rsvpwedday/ui/button";
import { Input } from "@rsvpwedday/ui/input";
import { Label } from "@rsvpwedday/ui/label";
import { Textarea } from "@rsvpwedday/ui/textarea";
import { notFound } from "next/navigation";
import { saveLead } from "@/app/actions";
import { ConsoleShell } from "@/components/console-shell";
import { ContactLinks } from "@/components/contact-links";
import { FormSelect } from "@/components/form-select";
import { PlaceMap } from "@/components/place-map";
import { leadStageLabels, leadStages } from "@/lib/crm";
import { getLead } from "@/lib/store";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const lead = await getLead(id);
	if (!lead) notFound();

	return (
		<ConsoleShell pathname="/leads">
			<div className="flex flex-col gap-8">
				<div>
					<h1 className="font-display text-3xl font-semibold tracking-tight">{lead.couple}</h1>
					<p className="text-ink-soft mt-1 font-serif text-sm">
						{leadStageLabels[lead.stage]} · {lead.place.label}
						{lead.date ? ` · ${lead.date}` : ""}
					</p>
					<div className="mt-3">
						<ContactLinks contact={lead.contact} />
					</div>
				</div>
				<PlaceMap place={lead.place} />
				<form action={saveLead} className="grid max-w-2xl gap-3 sm:grid-cols-2">
					<input type="hidden" name="id" value={lead.id} />
					<input type="hidden" name="createdAt" value={lead.createdAt} />
					<Field label="Couple" name="couple" defaultValue={lead.couple} />
					<Field label="Place" name="place" defaultValue={lead.place.label} />
					<Field label="Address" name="address" defaultValue={lead.place.address ?? ""} />
					<Field label="Date" name="date" type="date" defaultValue={lead.date ?? ""} />
					<FormSelect
						name="stage"
						label="Stage"
						defaultValue={lead.stage}
						options={leadStages.map((stage) => ({
							value: stage,
							label: leadStageLabels[stage],
						}))}
					/>
					<Field label="Source" name="source" defaultValue={lead.source ?? ""} />
					<Field label="Email" name="email" defaultValue={lead.contact.email ?? ""} />
					<Field label="Phone" name="phone" defaultValue={lead.contact.phone ?? ""} />
					<Field label="WhatsApp" name="whatsapp" defaultValue={lead.contact.whatsapp ?? ""} />
					<div className="sm:col-span-2">
						<Label htmlFor="notes">Notes</Label>
						<Textarea id="notes" name="notes" defaultValue={lead.notes ?? ""} />
					</div>
					<Button type="submit" className="sm:col-span-2">
						Save — geocode address
					</Button>
				</form>
			</div>
		</ConsoleShell>
	);
}

function Field({
	label,
	name,
	defaultValue,
	type = "text",
}: {
	label: string;
	name: string;
	defaultValue: string;
	type?: string;
}) {
	return (
		<div>
			<Label htmlFor={name}>{label}</Label>
			<Input id={name} name={name} type={type} defaultValue={defaultValue} />
		</div>
	);
}
