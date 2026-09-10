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
import { saveCouple } from "@/app/actions";
import { FormSelect } from "@/components/form-select";
import type { CoupleStatus } from "@/lib/crm";
import { coupleStatuses, coupleStatusLabels } from "@/lib/crm";

export function CoupleDialog({
	defaultStatus = "new",
	label = "New couple",
}: {
	defaultStatus?: CoupleStatus;
	label?: string;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [pending, setPending] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>{label}</Button>
			</DialogTrigger>
			<DialogContent
				className="max-h-[min(90vh,44rem)] overflow-y-auto sm:max-w-lg"
				showCloseButton
			>
				<form
					action={async (form) => {
						setPending(true);
						try {
							const saved = await saveCouple(form);
							setOpen(false);
							if (saved) router.push(`/couples/${saved.id}`);
							else router.refresh();
						} finally {
							setPending(false);
						}
					}}
				>
					<DialogHeader>
						<DialogTitle>New couple</DialogTitle>
						<DialogDescription>
							One record. Lead or client is a status — confirm them when the weekend is on the
							books.
						</DialogDescription>
					</DialogHeader>
					<div className="mt-4 grid gap-3 sm:grid-cols-2">
						<div className="sm:col-span-2">
							<Label htmlFor="couple">Couple</Label>
							<Input id="couple" name="couple" required placeholder="Elisa & Jonas" />
						</div>
						<div>
							<Label htmlFor="place">Place</Label>
							<Input id="place" name="place" required placeholder="Gozo" />
						</div>
						<div>
							<Label htmlFor="date">Date</Label>
							<Input id="date" name="date" type="date" />
						</div>
						<FormSelect
							name="status"
							label="Status"
							defaultValue={defaultStatus}
							options={coupleStatuses.map((status) => ({
								value: status,
								label: coupleStatusLabels[status],
							}))}
						/>
						<div>
							<Label htmlFor="whatsapp">WhatsApp</Label>
							<Input id="whatsapp" name="whatsapp" placeholder="+356 …" />
						</div>
						<div className="sm:col-span-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" name="email" type="email" />
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
