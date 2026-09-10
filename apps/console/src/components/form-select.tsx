"use client";

import { Label } from "@rsvpwedday/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@rsvpwedday/ui/select";
import { useState } from "react";

export function FormSelect({
	name,
	label,
	defaultValue,
	options,
}: {
	name: string;
	label: string;
	defaultValue: string;
	options: Array<{ value: string; label: string }>;
}) {
	const [value, setValue] = useState(defaultValue);
	return (
		<div>
			<Label htmlFor={name}>{label}</Label>
			<input type="hidden" name={name} value={value} />
			<Select value={value} onValueChange={(next) => setValue(next ?? defaultValue)}>
				<SelectTrigger id={name} className="mt-1 w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
