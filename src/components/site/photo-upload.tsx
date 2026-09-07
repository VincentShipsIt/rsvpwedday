"use client";

import { CameraIcon, ImagesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { addPhotos } from "@/app/rsvp/[token]/memories/actions";
import { MAX_CAPTION_LENGTH } from "@/domain/photo-book";
import type { Dictionary } from "@/i18n";
import { t } from "@/i18n";
import { uploadImage } from "@/lib/blob-upload";
import { downscaleImage, isWebDisplayable } from "@/lib/downscale-image";

const NAME_STORAGE_PREFIX = "wed:photo-uploader:";

export type PhotoUploadProps = {
	token: string;
	/** Everyone on this invitation, so a photo is signed by a person rather than a household. */
	guestNames: string[];
	uploadsConfigured: boolean;
	copy: Dictionary["photos"];
};

type Stage =
	| { kind: "idle" }
	| { kind: "preparing" }
	| { kind: "uploading"; done: number; total: number }
	| { kind: "done" }
	| { kind: "error"; message: string };

/*
 * The guest's way into the book. Two buttons rather than one: `capture` sends a phone straight to
 * its camera, while the plain input opens the camera roll for photos already taken — on a laptop
 * both are just a file picker. Files are shrunk in the browser first (`downscaleImage`, which also
 * turns an iPhone's HEIC into a JPEG other browsers can display), then uploaded straight to Blob,
 * and only the resulting URLs go through a Server Action.
 */
export function PhotoUpload({ token, guestNames, uploadsConfigured, copy }: PhotoUploadProps) {
	const router = useRouter();
	const cameraInputRef = useRef<HTMLInputElement>(null);
	const libraryInputRef = useRef<HTMLInputElement>(null);
	const [uploaderName, setUploaderName] = useState(guestNames[0] ?? "");
	const [caption, setCaption] = useState("");
	const [stage, setStage] = useState<Stage>({ kind: "idle" });

	// Several people share one household link, so remember which of them is holding the phone.
	useEffect(() => {
		const stored = window.localStorage.getItem(`${NAME_STORAGE_PREFIX}${token}`);
		if (stored && guestNames.includes(stored)) {
			setUploaderName(stored);
		}
	}, [token, guestNames]);

	function chooseName(name: string) {
		setUploaderName(name);
		window.localStorage.setItem(`${NAME_STORAGE_PREFIX}${token}`, name);
	}

	async function handleFiles(fileList: FileList | null) {
		const files = Array.from(fileList ?? []);
		if (files.length === 0) {
			return;
		}

		setStage({ kind: "preparing" });
		const prepared: File[] = [];
		for (const file of files) {
			if (!file.type.startsWith("image/") && isWebDisplayable(file)) {
				setStage({ kind: "error", message: copy.notAnImageError });
				return;
			}
			const shrunk = await downscaleImage(file);
			if (!isWebDisplayable(shrunk)) {
				// The browser could not decode HEIC, so it never became a JPEG; storing it would put
				// a photo in the book that most guests' phones cannot open.
				setStage({ kind: "error", message: copy.unsupportedFormatError });
				return;
			}
			prepared.push(shrunk);
		}

		const urls: string[] = [];
		for (const [index, file] of prepared.entries()) {
			setStage({ kind: "uploading", done: index, total: prepared.length });
			const result = await uploadImage(file, `/rsvp/${token}/memories/upload`);
			if (!result.ok) {
				setStage({ kind: "error", message: result.error });
				return;
			}
			urls.push(result.url);
		}

		const saved = await addPhotos(token, {
			uploaderName: uploaderName || guestNames[0] || "",
			caption: caption.trim(),
			urls,
		});
		if (!saved.ok) {
			setStage({ kind: "error", message: saved.error });
			return;
		}

		setCaption("");
		setStage({ kind: "done" });
		router.refresh();
	}

	const isBusy = stage.kind === "preparing" || stage.kind === "uploading";
	const isDisabled = !uploadsConfigured || isBusy;

	return (
		<div className="flex w-full max-w-xl flex-col gap-4 rounded-2xl bg-ivory-dark/60 p-6 ring-1 ring-ink/10">
			{guestNames.length > 1 && (
				<label className="flex flex-col gap-1 text-sm">
					<span className="text-ink/70">{copy.uploaderLabel}</span>
					<select
						value={uploaderName}
						onChange={(event) => chooseName(event.target.value)}
						className="rounded-lg border border-ink/15 bg-ivory px-3 py-2 text-base"
					>
						{guestNames.map((name) => (
							<option key={name} value={name}>
								{name}
							</option>
						))}
					</select>
				</label>
			)}

			<label className="flex flex-col gap-1 text-sm">
				<span className="text-ink/70">{copy.captionLabel}</span>
				<input
					type="text"
					value={caption}
					maxLength={MAX_CAPTION_LENGTH}
					placeholder={copy.captionPlaceholder}
					onChange={(event) => setCaption(event.target.value)}
					className="rounded-lg border border-ink/15 bg-ivory px-3 py-2 text-base"
				/>
			</label>

			<div className="flex flex-col gap-2 sm:flex-row">
				<button
					type="button"
					disabled={isDisabled}
					onClick={() => cameraInputRef.current?.click()}
					className="flex flex-1 items-center justify-center gap-2 rounded-full bg-green px-6 py-3 text-base text-ivory transition-opacity disabled:opacity-50"
				>
					<CameraIcon className="size-5" aria-hidden="true" />
					{copy.takePhotoButton}
				</button>
				<button
					type="button"
					disabled={isDisabled}
					onClick={() => libraryInputRef.current?.click()}
					className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-base ring-1 ring-ink/20 transition-opacity disabled:opacity-50"
				>
					<ImagesIcon className="size-5" aria-hidden="true" />
					{copy.choosePhotosButton}
				</button>
			</div>

			{/* `capture` makes a phone open its camera directly; the other input opens the roll. */}
			<input
				ref={cameraInputRef}
				type="file"
				accept="image/*"
				capture="environment"
				className="sr-only"
				onChange={(event) => {
					handleFiles(event.target.files);
					event.target.value = "";
				}}
			/>
			<input
				ref={libraryInputRef}
				type="file"
				accept="image/*"
				multiple
				className="sr-only"
				onChange={(event) => {
					handleFiles(event.target.files);
					event.target.value = "";
				}}
			/>

			<p className="text-xs text-ink/50">{copy.addHint}</p>

			<p aria-live="polite" className="min-h-5 text-sm">
				{stage.kind === "preparing" && <span className="text-ink/60">{copy.preparingLabel}</span>}
				{stage.kind === "uploading" && (
					<span className="text-ink/60">
						{stage.total > 1
							? t(copy.uploadProgress, { done: stage.done + 1, total: stage.total })
							: copy.uploadingLabel}
					</span>
				)}
				{stage.kind === "done" && <span className="text-green">{copy.successMessage}</span>}
				{stage.kind === "error" && <span className="text-rose">{stage.message}</span>}
				{stage.kind === "idle" && !uploadsConfigured && (
					<span className="text-rose">{copy.uploadDisabledMessage}</span>
				)}
			</p>
		</div>
	);
}
