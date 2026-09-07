"use client";

import { format } from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseWireDate, toWireDate } from "@/lib/wire-date";

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
	const selected = parseWireDate(value);

	function pickDay(day: Date | undefined) {
		if (!day) {
			return;
		}
		// A new day keeps whatever time was already chosen, so picking a different date does not
		// silently move a 15:00 ceremony to midnight.
		const time = selected ?? new Date();
		const hours = selected ? time.getHours() : DEFAULT_TIME.hours;
		const minutes = selected ? time.getMinutes() : DEFAULT_TIME.minutes;
		onChange(
			toWireDate(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes))
		);
		setIsOpen(false);
	}

	function pickTime(time: string) {
		const [hours, minutes] = time.split(":").map(Number);
		if (Number.isNaN(hours) || Number.isNaN(minutes)) {
			return;
		}
		const day = selected ?? new Date();
		onChange(
			toWireDate(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes))
		);
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
						value={selected ? format(selected, "HH:mm") : ""}
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
