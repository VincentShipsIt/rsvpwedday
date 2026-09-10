"use client";

import { LinkIcon, Music2Icon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { useId, useState } from "react";
import { MediaDropZone, mediaFileName } from "@/components/admin/media-drop-zone";
import { Button } from "@/components/ui/button";
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

// The background-music track: `ImageField`'s shape minus the downscale, with a native player in
// place of the picture so the couple can hear what they just uploaded. The file name stands in
// for the URL, which never shows.
export function AudioField({ label, value, onChange, blobConfigured, disabled }: AudioFieldProps) {
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
		setBusyLabel("Uploading…");
		try {
			const result = await uploadAudio(file);
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
				<div className="flex flex-col gap-3 rounded-lg border p-3">
					<div className="flex items-center gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted">
							<Music2Icon className="size-5 text-muted-foreground" aria-hidden="true" />
						</div>
						<p className="min-w-0 truncate text-sm font-medium">{mediaFileName(value)}</p>
					</div>
					{/* biome-ignore lint/a11y/useMediaCaption: admin preview of an instrumental track. */}
					<audio controls preload="none" src={value} className="w-full">
						Your browser can't play this file.
					</audio>
					<div className="flex flex-wrap items-center gap-1">
						{blobConfigured && (
							<MediaDropZone
								accept="audio/*"
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
						accept="audio/*"
						disabled={disabled}
						busyLabel={busyLabel}
						onFiles={handleFiles}
						label="Drag an MP3 here, or click to browse"
					/>
				)
			)}
			{uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
			{showLinkBox && (
				<div className="flex flex-col gap-1.5">
					{!blobConfigured && (
						<p className="text-xs text-muted-foreground">
							Uploads need a Blob store (set BLOB_READ_WRITE_TOKEN) — paste an audio link instead.
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
					or paste an audio link
				</Button>
			)}
		</div>
	);
}
