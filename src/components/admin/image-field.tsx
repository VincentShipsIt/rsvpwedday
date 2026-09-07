"use client";

import { cn } from "cn";
import { ImageIcon, SparklesIcon, UploadIcon } from "lucide-react";
import { type DragEvent, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IllustrationSubject } from "@/domain/illustration-prompt";
import { uploadImage } from "@/lib/blob-upload";
import { downscaleImage } from "@/lib/downscale-image";
import { generateIllustration } from "@/lib/generate-illustration";

export type ImageFieldProps = {
	label: string;
	value: string;
	onChange: (url: string) => void;
	/** Server-computed `isBlobConfigured()`, passed down rather than read client-side. */
	blobConfigured: boolean;
	/** Server-computed `isImageGenerationConfigured()`; without it the generate button is hidden. */
	aiConfigured?: boolean;
	/**
	 * Which block this field illustrates and what it currently says. Present means the field can
	 * offer "Generate illustration"; the prompt itself is built on the server.
	 */
	illustrate?: IllustrationSubject;
	disabled?: boolean;
};

// Shared by the hero image, each story milestone, and (via `ImageListField`) the gallery: a drop
// zone backed by `uploadImage` when Blob is configured, an optional AI illustration button, plus
// the URL input underneath so a pasted link always keeps working whatever else is available.
export function ImageField({
	label,
	value,
	onChange,
	blobConfigured,
	aiConfigured,
	illustrate,
	disabled,
}: ImageFieldProps) {
	const inputId = useId();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDraggingOver, setIsDraggingOver] = useState(false);
	const [isPreparing, setIsPreparing] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	async function handleFile(file: File | undefined) {
		if (!file) {
			return;
		}
		setUploadError(null);
		setIsPreparing(true);
		const prepared = await downscaleImage(file);
		setIsPreparing(false);
		setIsUploading(true);
		try {
			const result = await uploadImage(prepared);
			if (result.ok) {
				onChange(result.url);
			} else {
				setUploadError(result.error);
			}
		} finally {
			setIsUploading(false);
		}
	}

	async function handleGenerate() {
		if (!illustrate) {
			return;
		}
		setUploadError(null);
		setIsGenerating(true);
		try {
			const result = await generateIllustration(illustrate);
			if (result.ok) {
				onChange(result.url);
			} else {
				setUploadError(result.error);
			}
		} finally {
			setIsGenerating(false);
		}
	}

	function handleDrop(event: DragEvent<HTMLButtonElement>) {
		event.preventDefault();
		setIsDraggingOver(false);
		if (disabled || !blobConfigured || isPreparing || isUploading) {
			return;
		}
		handleFile(event.dataTransfer.files[0]);
	}

	const isBusy = isPreparing || isUploading || isGenerating;
	const dropZoneDisabled = disabled || !blobConfigured;
	const dropZoneLabel = isPreparing
		? "Preparing…"
		: isUploading
			? "Uploading…"
			: "Drag a photo here, or click to browse";

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
						{dropZoneLabel}
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
					{illustrate && aiConfigured && (
						<GenerateIllustrationButton
							disabled={disabled || !blobConfigured || isBusy}
							isGenerating={isGenerating}
							hint={
								value.trim() === ""
									? "Draws this block in the site's theme, from what you have typed."
									: "Draws this block in the site's theme, replacing the image above."
							}
							onGenerate={handleGenerate}
						/>
					)}
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

// Both image fields draw the same button; only the sentence beside it differs, because one
// replaces the image above it and the other appends to a list.
export function GenerateIllustrationButton({
	disabled,
	isGenerating,
	hint,
	onGenerate,
}: {
	disabled: boolean;
	isGenerating: boolean;
	hint: string;
	onGenerate: () => void;
}) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={onGenerate}>
				<SparklesIcon aria-hidden="true" />
				{isGenerating ? "Generating…" : "Generate illustration"}
			</Button>
			<span className="text-xs text-muted-foreground">
				{isGenerating ? "This takes a few seconds." : hint}
			</span>
		</div>
	);
}
