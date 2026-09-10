import { Badge } from "@rsvpwedday/ui/badge";
import { Button } from "@rsvpwedday/ui/button";
import { Input } from "@rsvpwedday/ui/input";
import { Label } from "@rsvpwedday/ui/label";
import { Textarea } from "@rsvpwedday/ui/textarea";
import { notFound } from "next/navigation";
import { saveProvider } from "@/app/actions";
import { ConsoleShell } from "@/components/console-shell";
import { ContactLinks } from "@/components/contact-links";
import { FormSelect } from "@/components/form-select";
import { PlaceMap } from "@/components/place-map";
import { providerKindLabels, providerKinds } from "@/lib/crm";
import { getProvider } from "@/lib/store";

export default async function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const provider = await getProvider(id);
	if (!provider) notFound();

	return (
		<ConsoleShell pathname="/providers">
			<div className="flex flex-col gap-8">
				<div>
					<h1 className="font-display text-3xl font-semibold tracking-tight">{provider.name}</h1>
					<p className="text-ink-soft mt-1 font-serif text-sm">
						{providerKindLabels[provider.kind]} · {provider.place.label}
					</p>
					<div className="mt-3">
						<ContactLinks contact={provider.contact} />
					</div>
					<ul className="mt-3 flex flex-wrap gap-1">
						{provider.tags.map((tag) => (
							<li key={tag}>
								<Badge variant="outline">{tag}</Badge>
							</li>
						))}
					</ul>
				</div>
				<PlaceMap place={provider.place} />
				<form action={saveProvider} className="grid max-w-2xl gap-3 sm:grid-cols-2">
					<input type="hidden" name="id" value={provider.id} />
					<Field label="Name" name="name" defaultValue={provider.name} />
					<FormSelect
						name="kind"
						label="Kind"
						defaultValue={provider.kind}
						options={providerKinds.map((kind) => ({
							value: kind,
							label: providerKindLabels[kind],
						}))}
					/>
					<Field label="Place" name="place" defaultValue={provider.place.label} />
					<Field label="Address" name="address" defaultValue={provider.place.address ?? ""} />
					<Field label="Phone" name="phone" defaultValue={provider.contact.phone ?? ""} />
					<Field label="WhatsApp" name="whatsapp" defaultValue={provider.contact.whatsapp ?? ""} />
					<Field label="Email" name="email" defaultValue={provider.contact.email ?? ""} />
					<Field label="Website" name="website" defaultValue={provider.website ?? ""} />
					<Field label="Instagram" name="instagram" defaultValue={provider.instagram ?? ""} />
					<Field label="Hours" name="hours" defaultValue={provider.hours ?? ""} />
					<Field label="Capacity" name="capacity" defaultValue={provider.capacity ?? ""} />
					<Field label="Tags" name="tags" defaultValue={provider.tags.join(", ")} />
					<div className="sm:col-span-2">
						<Label htmlFor="notes">Notes</Label>
						<Textarea id="notes" name="notes" defaultValue={provider.notes ?? ""} />
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
}: {
	label: string;
	name: string;
	defaultValue: string;
}) {
	return (
		<div>
			<Label htmlFor={name}>{label}</Label>
			<Input id={name} name={name} defaultValue={defaultValue} />
		</div>
	);
}
