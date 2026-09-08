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
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useId, useState } from "react";
import { updateGifts } from "@/app/admin/gifts/actions";
import { ImageField } from "@/components/admin/image-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Locale } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";
import { cn } from "@/lib/utils";

type GiftTranslationState = { locale: Locale; title: string; body: string };

export type GiftState = {
	id: string;
	sortOrder: number;
	imageUrl: string;
	url: string;
	price: string;
	translations: GiftTranslationState[];
	/** Who has taken it, so removing a spoken-for gift asks first. Never edited here. */
	claimedBy: string | null;
};

function emptyTranslations(): GiftTranslationState[] {
	return localeCodes.map((code) => ({ locale: code, title: "", body: "" }));
}

/*
 * The wish list the couple keeps. One row is one gift: a picture, a link, a free-text price and
 * the same three languages every other piece of guest-facing copy has.
 *
 * Nothing here says whether the list is a gift registry or a honeymoon one — "Two nights in the
 * riad, €180, [link]" and "Espresso machine, €199, [link]" are the same row. The section's own
 * heading and intro live on the wish-list block, on whichever page carries it.
 */
export function GiftsForm({
	initialGifts,
	blobConfigured,
	aiConfigured,
}: {
	initialGifts: GiftState[];
	blobConfigured: boolean;
	aiConfigured: boolean;
}) {
	const [gifts, setGifts] = useState<GiftState[]>(initialGifts);
	const dndId = useId();

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const { status, error, retry } = useAutosave({
		value: { gifts },
		save: ({ gifts: next }) =>
			updateGifts({
				gifts: next.map((gift, sortOrder) => ({
					id: gift.id,
					sortOrder,
					imageUrl: gift.imageUrl,
					url: gift.url,
					price: gift.price,
					translations: gift.translations,
				})),
			}),
	});

	function addGift() {
		// The id is minted here rather than by the database, so the very first save is already an
		// upsert against a stable row: without it every later save would delete and recreate the
		// gift, churning the id a guest's reservation points at.
		const id = crypto.randomUUID();
		setGifts((current) => [
			...current,
			{
				id,
				sortOrder: current.length,
				imageUrl: "",
				url: "",
				price: "",
				translations: emptyTranslations(),
				claimedBy: null,
			},
		]);
	}

	function updateGift(id: string, patch: Partial<Omit<GiftState, "translations">>) {
		setGifts((current) => current.map((gift) => (gift.id === id ? { ...gift, ...patch } : gift)));
	}

	function updateTranslation(id: string, locale: Locale, patch: Partial<GiftTranslationState>) {
		setGifts((current) =>
			current.map((gift) =>
				gift.id === id
					? {
							...gift,
							translations: gift.translations.map((translation) =>
								translation.locale === locale ? { ...translation, ...patch } : translation
							),
						}
					: gift
			)
		);
	}

	function handleDragEnd({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) {
			return;
		}
		setGifts((current) => {
			const from = current.findIndex((gift) => gift.id === active.id);
			const to = current.findIndex((gift) => gift.id === over.id);
			return from === -1 || to === -1 ? current : arrayMove(current, from, to);
		});
	}

	return (
		<div className="flex flex-col gap-6">
			<DndContext
				id={dndId}
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={gifts.map((gift) => gift.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="flex flex-col gap-3">
						{gifts.map((gift) => (
							<GiftRow
								key={gift.id}
								gift={gift}
								blobConfigured={blobConfigured}
								aiConfigured={aiConfigured}
								onChange={updateGift}
								onTranslationChange={updateTranslation}
								onRemove={() =>
									setGifts((current) => current.filter((entry) => entry.id !== gift.id))
								}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>

			<Button type="button" variant="secondary" size="sm" className="self-start" onClick={addGift}>
				<PlusIcon aria-hidden="true" />
				Add a gift
			</Button>

			<div className="flex items-center gap-3">
				<Button type="button" variant="secondary" disabled={status === "saving"} onClick={retry}>
					Save now
				</Button>
				<SaveStatus status={status} error={error} onRetry={retry} />
			</div>
		</div>
	);
}

function GiftRow({
	gift,
	blobConfigured,
	aiConfigured,
	onChange,
	onTranslationChange,
	onRemove,
}: {
	gift: GiftState;
	blobConfigured: boolean;
	aiConfigured: boolean;
	onChange: (id: string, patch: Partial<Omit<GiftState, "translations">>) => void;
	onTranslationChange: (id: string, locale: Locale, patch: Partial<GiftTranslationState>) => void;
	onRemove: () => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: gift.id,
	});
	const fieldId = useId();
	const english = gift.translations.find((translation) => translation.locale === "en");
	const label = english?.title.trim() || "this gift";

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={cn(
				"flex flex-col gap-4 rounded-lg border bg-background p-3",
				isDragging && "z-10 shadow-md ring-2 ring-ring"
			)}
		>
			<div className="flex items-center gap-2">
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="Reorder"
					className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
					{...attributes}
					{...listeners}
				>
					<GripVerticalIcon />
				</Button>
				<span className="min-w-0 flex-1 truncate text-sm font-medium">
					{english?.title.trim() || "Untitled gift"}
				</span>
				{gift.claimedBy && (
					<span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
						{gift.claimedBy}
					</span>
				)}
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label="Remove this gift"
							className="text-muted-foreground hover:text-destructive"
						>
							<Trash2Icon />
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Remove {label}?</AlertDialogTitle>
							<AlertDialogDescription>
								{gift.claimedBy
									? `${gift.claimedBy} has already said they're bringing this. Removing it takes their reservation with it, and they won't be told.`
									: "It disappears from the wish list on every page that shows it."}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Keep it</AlertDialogCancel>
							<AlertDialogAction onClick={onRemove}>Remove</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor={`${fieldId}-price`}>Price</Label>
					<Input
						id={`${fieldId}-price`}
						value={gift.price}
						placeholder="€120, or leave empty"
						onChange={(event) => onChange(gift.id, { price: event.target.value })}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor={`${fieldId}-url`}>Link (optional)</Label>
					<Input
						id={`${fieldId}-url`}
						value={gift.url}
						placeholder="https://"
						onChange={(event) => onChange(gift.id, { url: event.target.value })}
					/>
				</div>
			</div>

			<ImageField
				label="Photo"
				value={gift.imageUrl}
				onChange={(url) => onChange(gift.id, { imageUrl: url })}
				blobConfigured={blobConfigured}
				aiConfigured={aiConfigured}
				illustrate={{ placement: "GIFT", title: english?.title, body: english?.body }}
			/>

			<Tabs defaultValue={localeCodes[0]}>
				<TabsList>
					{localeCodes.map((code) => (
						<TabsTrigger key={code} value={code}>
							{locales[code].label}
						</TabsTrigger>
					))}
				</TabsList>
				{gift.translations.map((translation) => (
					<TabsContent
						key={translation.locale}
						value={translation.locale}
						className="flex flex-col gap-2"
					>
						<Input
							placeholder="Title"
							value={translation.title}
							onChange={(event) =>
								onTranslationChange(gift.id, translation.locale, { title: event.target.value })
							}
						/>
						<RichTextEditor
							placeholder="What it is, and why you'd love it"
							value={translation.body}
							onChange={(html) => onTranslationChange(gift.id, translation.locale, { body: html })}
						/>
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}
