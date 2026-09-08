"use client";

import { SparklesIcon } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

export type GenerateIllustrationButtonProps = {
	label: string;
	disabled?: boolean;
	busy?: boolean;
	variant?: "ghost" | "secondary";
	/** Free-text direction the couple typed for this one image; may be empty. */
	onGenerate: (instructions: string) => void;
};

/*
 * The "Generate illustration" button, with the prompt box behind it.
 *
 * The block's own heading and text already reach the server as the subject, and the theme,
 * couple names and venues are read there — but that only ever describes what the block *says*,
 * which for a gift called "Pomeranian Puppy" is not the picture anyone wanted. This adds the one
 * thing the couple could not otherwise give it: a sentence about the image itself. It is
 * optional, so the old one-click behaviour is still one click plus Enter.
 *
 * The text survives the popover closing, so "Regenerate" is a tweak-and-run rather than a retype.
 */
export function GenerateIllustrationButton({
	label,
	disabled,
	busy,
	variant = "ghost",
	onGenerate,
}: GenerateIllustrationButtonProps) {
	const promptId = useId();
	const [open, setOpen] = useState(false);
	const [instructions, setInstructions] = useState("");

	function submit() {
		setOpen(false);
		onGenerate(instructions.trim());
	}

	function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			submit();
		}
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button type="button" variant={variant} size="sm" disabled={disabled || busy}>
					<SparklesIcon aria-hidden="true" />
					{busy ? "Generating…" : label}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="flex w-80 flex-col gap-2">
				<Label htmlFor={promptId}>What should the picture show?</Label>
				<Textarea
					id={promptId}
					rows={3}
					autoFocus
					value={instructions}
					placeholder="A lemon tree over a stone terrace at dusk"
					onChange={(event) => setInstructions(event.target.value)}
					onKeyDown={handleKeyDown}
				/>
				<p className="text-xs text-muted-foreground">
					Optional. This block's heading and text are already in the prompt, along with the site's
					theme and the venues — add a line here only when you want something specific.
				</p>
				<Button type="button" size="sm" className="self-end" onClick={submit}>
					<SparklesIcon aria-hidden="true" />
					Generate
				</Button>
			</PopoverContent>
		</Popover>
	);
}
