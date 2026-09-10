"use client";

import { Button } from "@rsvpwedday/ui/button";
import { Input } from "@rsvpwedday/ui/input";
import { Label } from "@rsvpwedday/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@rsvpwedday/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function FilterBar({
	selects,
}: {
	selects: Array<{ name: string; label: string; options: Array<{ value: string; label: string }> }>;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();

	function setParam(name: string, value: string) {
		const next = new URLSearchParams(params.toString());
		if (!value || value === "all") next.delete(name);
		else next.set(name, value);
		const query = next.toString();
		router.push(query ? `${pathname}?${query}` : pathname);
	}

	return (
		<form
			className="flex flex-wrap items-end gap-3"
			onSubmit={(event) => {
				event.preventDefault();
				const form = new FormData(event.currentTarget);
				setParam("q", String(form.get("q") ?? ""));
			}}
		>
			<div className="min-w-48 flex-1">
				<Label htmlFor="crm-q" className="sr-only">
					Search
				</Label>
				<Input id="crm-q" name="q" defaultValue={params.get("q") ?? ""} placeholder="Search…" />
			</div>
			{selects.map((select) => (
				<div key={select.name}>
					<Label className="sr-only">{select.label}</Label>
					<Select
						value={params.get(select.name) ?? "all"}
						onValueChange={(value) => setParam(select.name, value ?? "all")}
					>
						<SelectTrigger>
							<SelectValue placeholder={select.label} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All {select.label.toLowerCase()}</SelectItem>
							{select.options.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			))}
			<Button type="submit" variant="outline" size="sm">
				Filter
			</Button>
		</form>
	);
}
