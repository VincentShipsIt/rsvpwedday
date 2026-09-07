"use client";

import { cn } from "cn";
import { Music2Icon, UploadIcon } from "lucide-react";
import { type DragEvent, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadAudio } from "@/lib/blob-upload";

export type AudioFieldProps = {
	label: string;
	value: string;
	onChange: (url: string) => void;
	/** Server-computed `isBlobConfigured()`, passed down rather than read client-side. */
	blobConfigured: boolean;
	disabled?: boolean;
};

// The background-music track: `ImageField`'s drop zone and URL input, minus the image downscale,
// plus a native player underneath so the couple can hear what they just uploaded.
export function AudioField({ label, value, onChange, blobConfigured, disabled }: AudioFieldProps) {
	const inputId = useId();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDraggingOver, setIsDraggingOver] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	async function handleFile(file: File | undefined) {
		if (!file) {
			return;
		}
		setUploadError(null);
		setIsUploading(true);
		try {
			const result = await uploadAudio(file);
			if (result.ok) {
				onChange(result.url);
			} else {
				setUploadError(result.error);
			}
		} finally {
			setIsUploading(false);
		}
	}

	function handleDrop(event: DragEvent<HTMLButtonElement>) {
		event.preventDefault();
		setIsDraggingOver(false);
		if (disabled || !blobConfigured || isUploading) {
			return;
		}
		handleFile(event.dataTransfer.files[0]);
	}

	const dropZoneDisabled = disabled || !blobConfigured;

	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={inputId}>{label}</Label>
			<div className="flex flex-col gap-2 sm:flex-row sm:items-start">
				<div className="flex size-20 shrink-0 items-center justify-center rounded-lg border bg-muted">
					<Music2Icon className="size-6 text-muted-foreground" aria-hidden="true" />
				</div>
				<div className="flex flex-1 flex-col gap-2">
					<button
						type="button"
						disabled={dropZoneDisabled}
						onClick={() => fileInputRef.current?.click()}
						onDragOver={(event) => {
							event.preventDefault();
							if (!dropZoneDisabled) {
								setIsDraggingOver(true);
							}
						}}
						onDragLeave={() => setIsDraggingOver(false)}
						onDrop={handleDrop}
						className={cn(
							"flex h-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground transition-colors",
							isDraggingOver && "border-ring bg-accent text-accent-foreground",
							dropZoneDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-accent"
						)}
					>
						<UploadIcon className="size-4" aria-hidden="true" />
						{isUploading ? "Uploading…" : "Drag an MP3 here, or click to browse"}
					</button>
					<input
						ref={fileInputRef}
						type="file"
						accept="audio/*"
						className="sr-only"
						disabled={dropZoneDisabled}
						onChange={(event) => {
							handleFile(event.target.files?.[0]);
							event.target.value = "";
						}}
					/>
					{!blobConfigured && (
						<p className="text-xs text-muted-foreground">
							Uploads need a Blob store (set BLOB_READ_WRITE_TOKEN) — paste an audio URL below
							instead.
						</p>
					)}
					{uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
					<Input
						id={inputId}
						placeholder="https://"
						value={value}
						disabled={disabled}
						onChange={(event) => onChange(event.target.value)}
					/>
					{value && (
						// biome-ignore lint/a11y/useMediaCaption: admin preview of an instrumental track.
						<audio controls preload="none" src={value} className="w-full">
							Your browser can't play this file.
						</audio>
					)}
				</div>
			</div>
		</div>
	);
}
