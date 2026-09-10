"use client";

import { format, parse } from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DEFAULT_TIME = { hours: 12, minutes: 0 };

export type DateTimeFieldProps = {
	label: string;
	/** A `yyyy-MM-ddTHH:mm` string, or empty for no date. */
	value: string;
	onChange: (value: string) => void;
	/** Show the time input beside the calendar. Off for a date that only needs a day. */
	showTime?: boolean;
	/** Offer a button that empties the field. Only for a field where empty means something. */
	clearable?: boolean;
	description?: string;
	disabled?: boolean;
};

/*
 * A date the couple picks off a calendar rather than types. Typing `2027-06-12T15:00` into a
 * native `datetime-local` is easy to get subtly wrong — a mistyped year reads as a valid date and
 * the countdown quietly points four centuries away — and it looks nothing like the rest of the
 * admin. The time stays a plain input beside it, which is the one part a keyboard does better.
 */
export function DateTimeField({
	label,
	value,
	onChange,
	showTime = true,
	clearable = false,
	description,
	disabled,
}: DateTimeFieldProps) {
	const fieldId = useId();
	const [isOpen, setIsOpen] = useState(false);
	// The calendar manipulates wall-date components only; the server applies the wedding zone.
	const parsed = parse(`${value.slice(0, 10)}T12:00`, "yyyy-MM-dd'T'HH:mm", new Date());
	const selected = Number.isNaN(parsed.getTime()) ? null : parsed;

	function pickDay(day: Date | undefined) {
		if (!day) {
			return;
		}
		// A new day keeps whatever time was already chosen, so picking a different date does not
		// silently move a 15:00 ceremony to midnight.
		const time = value ? value.slice(11, 16) : `${DEFAULT_TIME.hours}:00`;
		onChange(`${format(day, "yyyy-MM-dd")}T${time}`);
		setIsOpen(false);
	}

	function pickTime(time: string) {
		const [hours, minutes] = time.split(":").map(Number);
		if (Number.isNaN(hours) || Number.isNaN(minutes)) {
			return;
		}
		if (!/^\d{2}:\d{2}$/.test(time) || hours > 23 || minutes > 59) return;
		const day = selected ?? new Date();
		onChange(`${format(day, "yyyy-MM-dd")}T${time}`);
	}

	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={fieldId}>{label}</Label>
			<div className="flex flex-wrap items-center gap-2">
				<Popover open={isOpen} onOpenChange={setIsOpen}>
					<PopoverTrigger asChild>
						<Button
							id={fieldId}
							type="button"
							variant="outline"
							disabled={disabled}
							className="justify-start font-normal"
						>
							<CalendarIcon aria-hidden="true" />
							{selected ? format(selected, "EEEE d MMMM yyyy") : "Pick a date"}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={selected ?? undefined}
							defaultMonth={selected ?? undefined}
							onSelect={pickDay}
							autoFocus
						/>
					</PopoverContent>
				</Popover>

				{showTime && (
					<Input
						type="time"
						aria-label={`${label} time`}
						className="w-auto"
						disabled={disabled}
						value={value ? value.slice(11, 16) : ""}
						onChange={(event) => pickTime(event.target.value)}
					/>
				)}

				{clearable && value && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						aria-label={`Clear ${label.toLowerCase()}`}
						disabled={disabled}
						onClick={() => onChange("")}
					>
						<XIcon />
					</Button>
				)}
			</div>
			{description && <p className="text-xs text-muted-foreground">{description}</p>}
		</div>
	);
}
