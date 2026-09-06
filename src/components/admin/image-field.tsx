"use client";

import { cn } from "cn";
import { ImageIcon, UploadIcon } from "lucide-react";
import { type DragEvent, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImage } from "@/lib/blob-upload";

export type ImageFieldProps = {
	label: string;
	value: string;
	onChange: (url: string) => void;
	/** Server-computed `isBlobConfigured()`, passed down rather than read client-side. */
	blobConfigured: boolean;
	disabled?: boolean;
};

// Shared by the hero image, each story milestone, and (via `ImageListField`) the gallery: a drop
// zone backed by `uploadImage` when Blob is configured, plus the URL input underneath so a
// pasted link always keeps working, upload or no upload.
export function ImageField({ label, value, onChange, blobConfigured, disabled }: ImageFieldProps) {
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
			const formData = new FormData();
			formData.set("file", file);
			const result = await uploadImage(formData);
			if (result.ok) {
				onChange(result.url);
			} else {
				setUploadError(result.error);
			}
		} finally {
			setIsUploading(false);
		}
	}

	function handleDrop(event: DragEvent<HTMLDivElement>) {
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
				<div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
					{value ? (
						// biome-ignore lint/performance/noImgElement: admin-only thumbnail preview of an arbitrary, unconfigured external URL, not a next/image candidate.
						<img src={value} alt="" className="size-full object-cover" />
					) : (
						<ImageIcon className="size-6 text-muted-foreground" aria-hidden="true" />
					)}
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
						{isUploading ? "Uploading…" : "Drag a photo here, or click to browse"}
					</button>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						className="sr-only"
						disabled={dropZoneDisabled}
						onChange={(event) => {
							handleFile(event.target.files?.[0]);
							event.target.value = "";
						}}
					/>
					{!blobConfigured && (
						<p className="text-xs text-muted-foreground">
							Uploads need a Blob store (set BLOB_READ_WRITE_TOKEN) — paste an image URL below
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
				</div>
			</div>
		</div>
	);
}
