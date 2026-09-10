"use client";

import { cn } from "cn";
import { UploadIcon } from "lucide-react";
import { type DragEvent, type ReactNode, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export type MediaDropZoneProps = {
	/** Native `accept` for the hidden file input, e.g. `image/*`. */
	accept: string;
	multiple?: boolean;
	disabled?: boolean;
	/** Text under the icon while idle; a busy state replaces it. */
	label: ReactNode;
	busyLabel?: string | null;
	onFiles: (files: File[]) => void;
	className?: string;
	inputId?: string;
};

// The dashed "drag here or click to browse" surface every media field starts from. It owns only
// the drag-over highlight and the hidden file input; what happens to the files is the caller's.
export function MediaDropZone({
	accept,
	multiple,
	disabled,
	label,
	busyLabel,
	onFiles,
	className,
	inputId,
}: MediaDropZoneProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDraggingOver, setIsDraggingOver] = useState(false);
	const busy = Boolean(busyLabel);

	function takeFiles(list: FileList | null | undefined) {
		if (!list || list.length === 0 || disabled || busy) {
			return;
		}
		onFiles(multiple ? Array.from(list) : [list[0]]);
	}

	function handleDrop(event: DragEvent<HTMLButtonElement>) {
		event.preventDefault();
		setIsDraggingOver(false);
		takeFiles(event.dataTransfer.files);
	}

	return (
		<>
			<Button
				type="button"
				variant="outline"
				disabled={disabled}
				onClick={() => fileInputRef.current?.click()}
				onDragOver={(event) => {
					event.preventDefault();
					if (!disabled) {
						setIsDraggingOver(true);
					}
				}}
				onDragLeave={() => setIsDraggingOver(false)}
				onDrop={handleDrop}
				className={cn(
					"h-auto min-h-24 w-full flex-col gap-1.5 whitespace-normal rounded-lg border-dashed bg-transparent px-4 text-center text-xs font-normal text-muted-foreground shadow-none",
					isDraggingOver && "border-ring bg-accent text-accent-foreground",
					disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-accent",
					className
				)}
			>
				<UploadIcon className="size-4" aria-hidden="true" />
				{busy ? busyLabel : label}
			</Button>
			<input
				id={inputId}
				ref={fileInputRef}
				type="file"
				accept={accept}
				multiple={multiple}
				className="sr-only"
				disabled={disabled}
				onChange={(event) => {
					takeFiles(event.target.files);
					event.target.value = "";
				}}
			/>
		</>
	);
}

// Turns a Blob (or any) URL into something a person recognises: the last path segment, decoded,
// without the random suffix Vercel Blob appends before the extension.
export function mediaFileName(url: string): string {
	try {
		const path = new URL(url).pathname;
		const name = decodeURIComponent(path.slice(path.lastIndexOf("/") + 1));
		return name.replace(/-[A-Za-z0-9]{20,}(?=\.[A-Za-z0-9]+$)/, "") || url;
	} catch {
		return url;
	}
}
