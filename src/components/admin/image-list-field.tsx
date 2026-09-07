"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	rectSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "cn";
import { GripVerticalIcon, LinkIcon, XIcon } from "lucide-react";
import { useId, useState } from "react";
import { MediaDropZone } from "@/components/admin/media-drop-zone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImage } from "@/lib/blob-upload";
import { downscaleImage } from "@/lib/downscale-image";

export type ImageListFieldProps = {
	label: string;
	values: string[];
	onChange: (urls: string[]) => void;
	blobConfigured: boolean;
	disabled?: boolean;
};

// Gallery editor: a multi-file drop zone above a grid of thumbnails that reorder by drag and
// drop (pointer or keyboard). A tile shows the picture and a remove button, never its URL;
// "Add by link" covers the no-Blob fallback and external pictures.
export function ImageListField({
	label,
	values,
	onChange,
	blobConfigured,
	disabled,
}: ImageListFieldProps) {
	const inputId = useId();
	// dnd-kit's accessibility ids default to a counter that differs between server and client
	// render; a React id keeps them identical and stops the hydration warning.
	const dndId = useId();
	const [busyLabel, setBusyLabel] = useState<string | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [linkOpen, setLinkOpen] = useState(false);
	const [draftUrl, setDraftUrl] = useState("");

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	// The same URL may legitimately appear twice, so tiles are keyed by position plus URL. The
	// key is recomputed after every change, which is fine: dnd-kit only needs it stable for the
	// duration of one drag.
	const tiles = values.map((url, index) => ({ id: `${index}:${url}`, url }));

	async function handleFiles(files: File[]) {
		setUploadError(null);
		setBusyLabel("Preparing…");
		const prepared = await Promise.all(files.map(downscaleImage));
		setBusyLabel("Uploading…");
		try {
			const uploaded: string[] = [];
			for (const file of prepared) {
				const result = await uploadImage(file);
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
			setBusyLabel(null);
		}
	}

	function handleDragEnd({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) {
			return;
		}
		const from = tiles.findIndex((tile) => tile.id === active.id);
		const to = tiles.findIndex((tile) => tile.id === over.id);
		if (from !== -1 && to !== -1) {
			onChange(arrayMove(values, from, to));
		}
	}

	function removeAt(index: number) {
		onChange(values.filter((_, i) => i !== index));
	}

	function addLink() {
		const url = draftUrl.trim();
		if (url) {
			onChange([...values, url]);
		}
		setDraftUrl("");
		setLinkOpen(false);
	}

	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor={inputId}>{label}</Label>
			{blobConfigured ? (
				<MediaDropZone
					inputId={inputId}
					accept="image/*"
					multiple
					disabled={disabled}
					busyLabel={busyLabel}
					onFiles={handleFiles}
					label="Drag photos here, or click to browse (multiple allowed)"
				/>
			) : (
				<p className="text-xs text-muted-foreground">
					Uploads need a Blob store (set BLOB_READ_WRITE_TOKEN) — add image links instead.
				</p>
			)}
			{uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

			{tiles.length > 0 && (
				<DndContext
					id={dndId}
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<SortableContext items={tiles.map((tile) => tile.id)} strategy={rectSortingStrategy}>
						<ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
							{tiles.map((tile, index) => (
								<GalleryTile
									key={tile.id}
									id={tile.id}
									url={tile.url}
									position={index + 1}
									disabled={disabled}
									onRemove={() => removeAt(index)}
								/>
							))}
						</ul>
					</SortableContext>
				</DndContext>
			)}

			{linkOpen ? (
				<div className="flex gap-2">
					<Input
						placeholder="https://"
						value={draftUrl}
						disabled={disabled}
						autoFocus
						onChange={(event) => setDraftUrl(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								addLink();
							}
						}}
					/>
					<Button type="button" variant="secondary" disabled={disabled} onClick={addLink}>
						Add
					</Button>
					<Button type="button" variant="ghost" onClick={() => setLinkOpen(false)}>
						Cancel
					</Button>
				</div>
			) : (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="self-start"
					disabled={disabled}
					onClick={() => setLinkOpen(true)}
				>
					<LinkIcon aria-hidden="true" />
					Add by link
				</Button>
			)}
		</div>
	);
}

type GalleryTileProps = {
	id: string;
	url: string;
	position: number;
	disabled?: boolean;
	onRemove: () => void;
};

function GalleryTile({ id, url, position, disabled, onRemove }: GalleryTileProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
		disabled,
	});

	return (
		<li
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={cn(
				"group relative aspect-square overflow-hidden rounded-lg border bg-muted",
				isDragging && "z-10 shadow-lg ring-2 ring-ring"
			)}
		>
			{/* biome-ignore lint/performance/noImgElement: admin-only thumbnail of an arbitrary, unconfigured external URL. */}
			<img src={url} alt="" className="size-full object-cover" draggable={false} />
			<Button
				type="button"
				variant="ghost"
				aria-label={`Photo ${position}, drag to reorder`}
				disabled={disabled}
				className="absolute inset-0 h-auto w-full cursor-grab touch-none rounded-none hover:bg-transparent active:cursor-grabbing"
				{...attributes}
				{...listeners}
			>
				<span className="absolute left-1.5 top-1.5 rounded-md bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
					<GripVerticalIcon className="size-3.5" aria-hidden="true" />
				</span>
			</Button>
			<Button
				type="button"
				variant="secondary"
				size="icon-xs"
				aria-label={`Remove photo ${position}`}
				disabled={disabled}
				className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
				onClick={onRemove}
			>
				<XIcon className="size-3.5" />
			</Button>
		</li>
	);
}
