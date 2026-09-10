"use client";

import { Button } from "@rsvpwedday/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@rsvpwedday/ui/dialog";
import { Input } from "@rsvpwedday/ui/input";
import { Label } from "@rsvpwedday/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveProvider } from "@/app/actions";
import { FormSelect } from "@/components/form-select";
import { type Provider, providerKindLabels, providerKinds } from "@/lib/crm";

/* One dialog for both jobs: with no `provider` it creates, with one it edits.
   The id rides along as a hidden field, which is what makes saveProvider
   update the existing row instead of slugging a new one from the name. */
export function ProviderDialog({
	provider,
	label,
	variant = "default",
}: {
	provider?: Provider;
	label?: string;
	variant?: "default" | "outline";
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [pending, setPending] = useState(false);
	const editing = provider !== undefined;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant={variant}>{label ?? (editing ? "Edit" : "New provider")}</Button>
			</DialogTrigger>
			<DialogContent
				className="max-h-[min(90vh,44rem)] overflow-y-auto sm:max-w-lg"
				showCloseButton
			>
				<form
					action={async (form) => {
						setPending(true);
						try {
							await saveProvider(form);
							setOpen(false);
							router.refresh();
						} finally {
							setPending(false);
						}
					}}
				>
					{provider ? <input type="hidden" name="id" value={provider.id} /> : null}
					<DialogHeader>
						<DialogTitle>{editing ? provider.name : "New provider"}</DialogTitle>
						<DialogDescription>
							An address is geocoded on save, which is what puts the pin on the map.
						</DialogDescription>
					</DialogHeader>
					<div className="mt-4 grid gap-3 sm:grid-cols-2">
						<div className="sm:col-span-2">
							<Label htmlFor="provider-name">Name</Label>
							<Input
								id="provider-name"
								name="name"
								defaultValue={provider?.name ?? ""}
								required
								placeholder="Trattoria Luna"
							/>
						</div>
						<FormSelect
							name="kind"
							label="Kind"
							defaultValue={provider?.kind ?? "kitchen"}
							options={providerKinds.map((kind) => ({
								value: kind,
								label: providerKindLabels[kind],
							}))}
						/>
						<div>
							<Label htmlFor="provider-place">Place</Label>
							<Input
								id="provider-place"
								name="place"
								defaultValue={provider?.place.label ?? ""}
								required
								placeholder="Victoria"
							/>
						</div>
						<div className="sm:col-span-2">
							<Label htmlFor="provider-address">Address</Label>
							<Input
								id="provider-address"
								name="address"
								defaultValue={provider?.place.address ?? ""}
								placeholder="Triq ir-Repubblika, Victoria"
							/>
						</div>
						<div>
							<Label htmlFor="provider-phone">Phone</Label>
							<Input
								id="provider-phone"
								name="phone"
								defaultValue={provider?.contact.phone ?? ""}
								placeholder="+356 …"
							/>
						</div>
						<div>
							<Label htmlFor="provider-whatsapp">WhatsApp</Label>
							<Input
								id="provider-whatsapp"
								name="whatsapp"
								defaultValue={provider?.contact.whatsapp ?? ""}
								placeholder="+356 …"
							/>
						</div>
						<div className="sm:col-span-2">
							<Label htmlFor="provider-email">Email</Label>
							<Input
								id="provider-email"
								name="email"
								defaultValue={provider?.contact.email ?? ""}
								type="email"
							/>
						</div>
						<div>
							<Label htmlFor="provider-website">Website</Label>
							<Input
								id="provider-website"
								name="website"
								defaultValue={provider?.website ?? ""}
								placeholder="https://…"
							/>
						</div>
						<div>
							<Label htmlFor="provider-capacity">Capacity</Label>
							<Input
								id="provider-capacity"
								name="capacity"
								defaultValue={provider?.capacity ?? ""}
								placeholder="180 seated"
							/>
						</div>
						<div>
							<Label htmlFor="provider-rating">Rating</Label>
							<Input
								id="provider-rating"
								name="rating"
								type="number"
								step="0.1"
								min="0"
								max="5"
								defaultValue={provider?.rating ?? ""}
								placeholder="4.8"
							/>
						</div>
						<div>
							<Label htmlFor="provider-reviewCount">Reviews</Label>
							<Input
								id="provider-reviewCount"
								name="reviewCount"
								type="number"
								min="0"
								defaultValue={provider?.reviewCount ?? ""}
								placeholder="132"
							/>
						</div>
						<div className="sm:col-span-2">
							<Label htmlFor="provider-reviewsUrl">Reviews link</Label>
							<Input
								id="provider-reviewsUrl"
								name="reviewsUrl"
								defaultValue={provider?.reviewsUrl ?? ""}
								placeholder="https://maps.google.com/…"
							/>
						</div>
						<div className="sm:col-span-2">
							<Label htmlFor="provider-tags">Tags</Label>
							<Input
								id="provider-tags"
								name="tags"
								defaultValue={provider?.tags.join(", ") ?? ""}
								placeholder="clifftop, hotel"
							/>
						</div>
						<div className="sm:col-span-2">
							<Label htmlFor="provider-notes">Note</Label>
							<Input
								id="provider-notes"
								name="notes"
								defaultValue={provider?.notes ?? ""}
								placeholder="Child plates without a named list."
							/>
						</div>
					</div>
					<DialogFooter className="mt-4">
						<Button type="submit" disabled={pending}>
							{pending ? "Saving…" : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
