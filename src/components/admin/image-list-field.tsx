"use client";

import { cn } from "cn";
import { ArrowDownIcon, ArrowUpIcon, ImageIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { type DragEvent, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImage } from "@/lib/blob-upload";

export type ImageListFieldProps = {
	label: string;
	values: string[];
	onChange: (urls: string[]) => void;
	blobConfigured: boolean;
	disabled?: boolean;
};

// Gallery editor: a multi-file drop zone above a grid of thumbnails, each with a URL input
// (pasting a link still works) and reorder/remove controls. No drag-sorting library — move
// up/down buttons cover reordering.
export function ImageListField({
	label,
	values,
	onChange,
	blobConfigured,
	disabled,
}: ImageListFieldProps) {
	const inputId = useId();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDraggingOver, setIsDraggingOver] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	async function handleFiles(files: FileList | File[] | null | undefined) {
		if (!files || files.length === 0) {
			return;
		}
		setUploadError(null);
		setIsUploading(true);
		try {
			const uploaded: string[] = [];
			for (const file of Array.from(files)) {
				const formData = new FormData();
				formData.set("file", file);
				const result = await uploadImage(formData);
				if (result.ok) {
					uploaded.push(result.url);
				} else {
					setUploadError(result.error);
					break;
				}
			}
			if (uploaded.length > 0) {
				onChange([...values, ...uploaded]);
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
		handleFiles(event.dataTransfer.files);
	}

	function updateAt(index: number, url: string) {
		onChange(values.map((value, i) => (i === index ? url : value)));
	}

	function removeAt(index: number) {
		onChange(values.filter((_, i) => i !== index));
	}

	function moveBy(index: number, delta: number) {
		const target = index + delta;
		if (target < 0 || target >= values.length) {
			return;
		}
		const next = [...values];
		[next[index], next[target]] = [next[target], next[index]];
		onChange(next);
	}

	function addBlank() {
		onChange([...values, ""]);
	}

	const dropZoneDisabled = disabled || !blobConfigured;

	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor={inputId}>{label}</Label>
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
				{isUploading ? "Uploading…" : "Drag photos here, or click to browse (multiple allowed)"}
			</button>
			<input
				id={inputId}
				ref={fileInputRef}
				type="file"
				accept="image/*"
				multiple
				className="sr-only"
				disabled={dropZoneDisabled}
				onChange={(event) => {
					handleFiles(event.target.files);
					event.target.value = "";
				}}
			/>
			{!blobConfigured && (
				<p className="text-xs text-muted-foreground">
					Uploads need a Blob store (set BLOB_READ_WRITE_TOKEN) — add image URLs below instead.
				</p>
			)}
			{uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

			<div className="grid gap-3 sm:grid-cols-2">
				{values.map((value, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: entries carry no stable id (plain URL strings); order is the only signal that changes, and it drives these rows.
					<div key={index} className="flex flex-col gap-2 rounded-lg border p-3">
						<div className="flex gap-2">
							<div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
								{value ? (
									// biome-ignore lint/performance/noImgElement: admin-only thumbnail preview of an arbitrary, unconfigured external URL.
									<img src={value} alt="" className="size-full object-cover" />
								) : (
									<ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
								)}
							</div>
							<Input
								placeholder="https://"
								value={value}
								disabled={disabled}
								onChange={(event) => updateAt(index, event.target.value)}
							/>
						</div>
						<div className="flex items-center gap-1">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								disabled={disabled || index === 0}
								aria-label="Move earlier"
								onClick={() => moveBy(index, -1)}
							>
								<ArrowUpIcon />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								disabled={disabled || index === values.length - 1}
								aria-label="Move later"
								onClick={() => moveBy(index, 1)}
							>
								<ArrowDownIcon />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="ml-auto"
								disabled={disabled}
								aria-label="Remove photo"
								onClick={() => removeAt(index)}
							>
								<Trash2Icon />
							</Button>
						</div>
					</div>
				))}
			</div>

			<Button type="button" variant="secondary" size="sm" className="self-start" onClick={addBlank}>
				Add image URL
			</Button>
		</div>
	);
}
