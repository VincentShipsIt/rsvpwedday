"use client";

import { CameraIcon, ImagesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { addPhotos, preparePhotoUpload } from "@/app/rsvp/[token]/memories/actions";
import { type PendingPhoto, savePhotoBatch } from "@/domain/photo-batch";
import { MAX_CAPTION_LENGTH, MAX_PHOTO_BATCH } from "@/domain/photo-book";
import type { Dictionary } from "@/i18n";
import { t } from "@/i18n";
import { downscaleImage, isWebDisplayable } from "@/lib/downscale-image";
import { uploadGuestPhoto } from "@/lib/guest-photo-upload";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

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
 * and only their verified receipt IDs go through a Server Action.
 */
export function PhotoUpload({ token, guestNames, uploadsConfigured, copy }: PhotoUploadProps) {
	const router = useRouter();
	const cameraInputRef = useRef<HTMLInputElement>(null);
	const libraryInputRef = useRef<HTMLInputElement>(null);
	const [uploaderName, setUploaderName] = useState(guestNames[0] ?? "");
	const [caption, setCaption] = useState("");
	const pending = useRef<PendingPhoto<File>[]>([]);
	const busy = useRef(false);
	const [stage, setStage] = useState<Stage>({ kind: "idle" });

	// Several people share one household link, so remember which of them is holding the phone.
	useEffect(() => {
		try {
			const stored = window.localStorage.getItem(`${NAME_STORAGE_PREFIX}${token}`);
			if (stored && guestNames.includes(stored)) setUploaderName(stored);
		} catch {
			// Remembering a name is optional when browser storage is unavailable.
		}
	}, [token, guestNames]);

	function chooseName(name: string) {
		setUploaderName(name);
		try {
			window.localStorage.setItem(`${NAME_STORAGE_PREFIX}${token}`, name);
		} catch {
			// The selected name still works for this visit.
		}
	}

	async function resumeBatch() {
		if (busy.current) return;
		busy.current = true;
		const total = pending.current.length;
		try {
			await savePhotoBatch(pending.current, {
				prepare: () => preparePhotoUpload(token),
				upload: (file, receipt) => uploadGuestPhoto(file, token, receipt),
				register: async (receiptId) => {
					const result = await addPhotos(token, {
						uploaderName: uploaderName || guestNames[0] || "",
						caption: caption.trim(),
						receiptIds: [receiptId],
					});
					return result.ok;
				},
				progress: (remaining) => setStage({ kind: "uploading", done: total - remaining, total }),
			});
			setCaption("");
			setStage({ kind: "done" });
		} catch {
			setStage({ kind: "error", message: copy.uploadError });
		} finally {
			busy.current = false;
			router.refresh();
		}
	}

	async function handleFiles(fileList: FileList | null) {
		const files = Array.from(fileList ?? []);
		if (busy.current || files.length === 0) return;
		if (files.length > MAX_PHOTO_BATCH) {
			setStage({ kind: "error", message: t(copy.batchLimitError, { count: MAX_PHOTO_BATCH }) });
			return;
		}
		busy.current = true;
		setStage({ kind: "preparing" });
		try {
			const prepared: PendingPhoto<File>[] = [];
			for (const file of files) {
				if (!file.type.startsWith("image/") && isWebDisplayable(file))
					throw new Error(copy.notAnImageError);
				const shrunk = await downscaleImage(file);
				if (!isWebDisplayable(shrunk)) throw new Error(copy.unsupportedFormatError);
				if (shrunk.size > MAX_UPLOAD_BYTES) throw new Error(copy.uploadError);
				prepared.push({ file: shrunk });
			}
			pending.current = prepared;
		} catch (error) {
			setStage({
				kind: "error",
				message: error instanceof Error ? error.message : copy.uploadError,
			});
			return;
		} finally {
			busy.current = false;
		}
		await resumeBatch();
	}

	const isBusy = stage.kind === "preparing" || stage.kind === "uploading";
	const isDisabled = !uploadsConfigured || isBusy || pending.current.length > 0;

	return (
		<div className="flex w-full max-w-xl flex-col gap-4 rounded-2xl bg-ivory-dark/60 p-6 ring-1 ring-ink/10">
			{guestNames.length > 1 && (
				<label className="flex flex-col gap-1 text-sm">
					<span className="text-ink/70">{copy.uploaderLabel}</span>
					<select
						value={uploaderName}
						disabled={isBusy || pending.current.length > 0}
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
					disabled={isBusy || pending.current.length > 0}
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

			{stage.kind === "error" && pending.current.length > 0 && (
				<button
					type="button"
					onClick={() => resumeBatch()}
					className="rounded-full px-6 py-3 ring-1 ring-ink/20"
				>
					{copy.retryButton}
				</button>
			)}
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
