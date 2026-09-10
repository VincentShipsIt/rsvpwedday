"use client";

import { LinkIcon, Trash2Icon } from "lucide-react";
import { useId, useState } from "react";
import { GenerateIllustrationButton } from "@/components/admin/generate-illustration-button";
import { ImageLightbox, ImageThumbnail } from "@/components/admin/image-lightbox";
import { MediaDropZone } from "@/components/admin/media-drop-zone";
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
	 * What this field illustrates and what the block currently says. Present means the field can
	 * offer "Generate illustration"; the prompt itself is built on the server.
	 */
	illustrate?: IllustrationSubject;
	disabled?: boolean;
};

// Shared by the hero image, each story milestone, and the guide sections and cards. Empty, it is
// a drop zone; filled, it is a square thumbnail on the right of a compact row of actions, which
// clicks through to `ImageLightbox` for the whole picture. A full-width banner preview was the
// wrong shape for every image the site actually holds — a 16:9 hero, a 4:3 gift and a portrait
// photograph all came out as the same letterbox crop, and each field took a screenful. The URL
// never shows — "Use a link" reveals a paste box for the no-Blob fallback or an external picture.
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

	async function handleGenerate(instructions: string) {
		if (!illustrate) {
			return;
		}
		setUploadError(null);
		setBusyLabel("Generating…");
		try {
			const result = await generateIllustration({ ...illustrate, instructions });
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
	// Generation stores its result in Blob, so it needs that token as much as an upload does.
	const canGenerate = Boolean(illustrate) && Boolean(aiConfigured) && blobConfigured;

	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={inputId}>{label}</Label>
			{value ? (
				<div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-2">
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						{blobConfigured && (
							<MediaDropZone
								accept="image/*"
								disabled={disabled}
								busyLabel={busyLabel}
								onFiles={handleFiles}
								label="Drop a new photo here, or click to browse"
								className="min-h-14 py-2"
							/>
						)}
						<div className="flex flex-wrap items-center gap-1">
							{canGenerate && (
								<GenerateIllustrationButton
									label="Regenerate"
									disabled={disabled || busy}
									busy={busyLabel === "Generating…"}
									onGenerate={handleGenerate}
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
					<ImageLightbox
						url={value}
						title={label}
						trigger={<ImageThumbnail url={value} label={label} />}
					/>
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
			{canGenerate && !value && (
				<div className="flex flex-wrap items-center gap-2">
					<GenerateIllustrationButton
						label="Generate illustration"
						variant="secondary"
						disabled={disabled || busy}
						busy={busyLabel === "Generating…"}
						onGenerate={handleGenerate}
					/>
					<span className="text-xs text-muted-foreground">
						{busyLabel === "Generating…"
							? "This takes a few seconds."
							: "Drawn in the site's theme, from what you have typed."}
					</span>
				</div>
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
