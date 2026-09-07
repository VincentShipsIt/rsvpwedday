"use client";

import { LinkIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { useId, useState } from "react";
import { MediaDropZone } from "@/components/admin/media-drop-zone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImage } from "@/lib/blob-upload";
import { downscaleImage } from "@/lib/downscale-image";

export type ImageFieldProps = {
	label: string;
	value: string;
	onChange: (url: string) => void;
	/** Server-computed `isBlobConfigured()`, passed down rather than read client-side. */
	blobConfigured: boolean;
	disabled?: boolean;
};

// Shared by the hero image, each story milestone, and the guide sections and cards. Empty, it is
// a drop zone; filled, it shows the picture itself with Replace and Remove. The URL never shows —
// "Use a link" reveals a paste box for the no-Blob fallback or an external picture.
export function ImageField({ label, value, onChange, blobConfigured, disabled }: ImageFieldProps) {
	const inputId = useId();
	const [busyLabel, setBusyLabel] = useState<string | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [linkOpen, setLinkOpen] = useState(false);
	const [draftUrl, setDraftUrl] = useState("");

	async function handleFiles([file]: File[]) {
		if (!file) {
			return;
		}
		setUploadError(null);
		setBusyLabel("Preparing…");
		const prepared = await downscaleImage(file);
		setBusyLabel("Uploading…");
		try {
			const result = await uploadImage(prepared);
			if (result.ok) {
				onChange(result.url);
				setLinkOpen(false);
			} else {
				setUploadError(result.error);
			}
		} finally {
			setBusyLabel(null);
		}
	}

	function applyLink() {
		const url = draftUrl.trim();
		if (url) {
			onChange(url);
		}
		setDraftUrl("");
		setLinkOpen(false);
	}

	const showLinkBox = linkOpen || (!blobConfigured && !value);
	const busy = Boolean(busyLabel);

	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={inputId}>{label}</Label>
			{value ? (
				<div className="overflow-hidden rounded-lg border bg-muted">
					{/* biome-ignore lint/performance/noImgElement: admin-only preview of an arbitrary, unconfigured external URL, not a next/image candidate. */}
					<img src={value} alt="" className="max-h-64 w-full object-cover" />
					<div className="flex flex-wrap items-center gap-1 border-t bg-background p-1.5">
						{blobConfigured && (
							<MediaDropZone
								accept="image/*"
								disabled={disabled}
								busyLabel={busyLabel}
								onFiles={handleFiles}
								label={
									<span className="inline-flex items-center gap-1.5">
										<RefreshCwIcon className="size-3.5" aria-hidden="true" />
										Replace
									</span>
								}
								className="min-h-8 flex-row border-0 px-2 py-1 text-xs [&>svg:first-child]:hidden"
							/>
						)}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={disabled || busy}
							onClick={() => {
								setDraftUrl(value);
								setLinkOpen((open) => !open);
							}}
						>
							<LinkIcon aria-hidden="true" />
							Use a link
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="ml-auto text-destructive hover:text-destructive"
							disabled={disabled || busy}
							onClick={() => onChange("")}
						>
							<Trash2Icon aria-hidden="true" />
							Remove
						</Button>
					</div>
				</div>
			) : (
				blobConfigured && (
					<MediaDropZone
						accept="image/*"
						disabled={disabled}
						busyLabel={busyLabel}
						onFiles={handleFiles}
						label="Drag a photo here, or click to browse"
						className="min-h-32"
					/>
				)
			)}
			{uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
			{showLinkBox && (
				<div className="flex flex-col gap-1.5">
					{!blobConfigured && (
						<p className="text-xs text-muted-foreground">
							Uploads need a Blob store (set BLOB_READ_WRITE_TOKEN) — paste an image link instead.
						</p>
					)}
					<div className="flex gap-2">
						<Input
							id={inputId}
							placeholder="https://"
							value={draftUrl}
							disabled={disabled}
							onChange={(event) => setDraftUrl(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									applyLink();
								}
							}}
						/>
						<Button type="button" variant="secondary" disabled={disabled} onClick={applyLink}>
							Use
						</Button>
					</div>
				</div>
			)}
			{!showLinkBox && !value && (
				<Button
					type="button"
					variant="link"
					size="sm"
					className="h-auto self-start px-0 text-xs"
					disabled={disabled}
					onClick={() => setLinkOpen(true)}
				>
					or paste an image link
				</Button>
			)}
		</div>
	);
}
