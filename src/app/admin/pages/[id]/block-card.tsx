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
import Link from "next/link";
import { useId, useState } from "react";
import type { BlockItemState, BlockState, PageOption } from "@/app/admin/pages/[id]/block-types";
import { deleteBlock, updateBlock } from "@/app/admin/pages/actions";
import { ImageField } from "@/components/admin/image-field";
import { ImageListField } from "@/components/admin/image-list-field";
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { BLOCK_DEFINITIONS } from "@/domain/blocks";
import { blockIllustrationPlacement } from "@/domain/illustration-prompt";
import { BlockType, type Locale } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

// Where a built-in block's own content is edited, since the block itself only carries the
// heading and the anchor.
const BUILT_IN_SOURCES: Partial<Record<BlockType, { href: string; label: string }>> = {
	[BlockType.STORY]: { href: "/admin/settings/milestones", label: "Edit the milestones" },
	[BlockType.EVENTS]: { href: "/admin/settings/events", label: "Edit the events" },
	[BlockType.RSVP]: { href: "/admin/settings", label: "Edit the RSVP deadline" },
	[BlockType.GIFTS]: { href: "/admin/gifts", label: "Edit the wish list" },
};

export function BlockCard({
	block,
	locale,
	blobConfigured,
	aiConfigured,
	pageOptions,
	onRemoved,
	onAddBelow,
}: {
	block: BlockState;
	locale: Locale;
	blobConfigured: boolean;
	aiConfigured: boolean;
	pageOptions: PageOption[];
	onRemoved: (id: string) => void;
	onAddBelow: (afterBlockId: string) => void;
}) {
	const definition = BLOCK_DEFINITIONS[block.type];
	const fields = definition.fields;
	const anchorId = useId();
	const [state, setState] = useState(block);
	const [isDeleting, setIsDeleting] = useState(false);

	// What this block's image field illustrates: the block's type, plus whatever has been typed
	// into it in English — the source-of-truth locale, and the only one guaranteed to be filled in.
	const placement = blockIllustrationPlacement(block.type);
	const english = state.translations.find((entry) => entry.locale === "en");
	const illustrate = placement
		? { placement, title: english?.title, body: english?.body }
		: undefined;

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: block.id,
	});

	// One block, one save: the payload names only this block's id, so a save here can never touch
	// its neighbours the way the old whole-page forms could.
	const { status, error, retry } = useAutosave({
		value: state,
		save: (value) =>
			updateBlock({
				id: value.id,
				anchor: value.anchor,
				imageUrl: value.imageUrl,
				imageUrls: value.imageUrls,
				url: value.url,
				translations: value.translations,
				items: value.items.map((item, sortOrder) => ({
					id: item.id,
					sortOrder,
					url: item.url,
					imageUrl: item.imageUrl,
					translations: item.translations,
				})),
			}),
	});

	const translation =
		state.translations.find((entry) => entry.locale === locale) ??
		({ locale, title: "", body: "" } as const);

	function updateTranslation(patch: { title?: string; body?: string }) {
		setState((current) => ({
			...current,
			translations: current.translations.map((entry) =>
				entry.locale === locale ? { ...entry, ...patch } : entry
			),
		}));
	}

	function updateItem(key: string, patch: Partial<Omit<BlockItemState, "translations">>) {
		setState((current) => ({
			...current,
			items: current.items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
		}));
	}

	function updateItemTranslation(key: string, patch: { title?: string; body?: string }) {
		setState((current) => ({
			...current,
			items: current.items.map((item) =>
				item.key === key
					? {
							...item,
							translations: item.translations.map((entry) =>
								entry.locale === locale ? { ...entry, ...patch } : entry
							),
						}
					: item
			),
		}));
	}

	async function handleDelete() {
		setIsDeleting(true);
		const result = await deleteBlock(block.id);
		if (result.ok) {
			onRemoved(block.id);
		} else {
			setIsDeleting(false);
		}
	}

	return (
		<Card
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={cn("gap-0 py-0", isDragging && "z-10 shadow-lg ring-2 ring-ring")}
		>
			<div className="flex items-center gap-2 border-b px-3 py-2">
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label={`Reorder the ${definition.label} block`}
					className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
					{...attributes}
					{...listeners}
				>
					<GripVerticalIcon />
				</Button>
				<div className="flex min-w-0 flex-1 flex-col">
					<span className="truncate text-sm font-medium">{definition.label}</span>
					<span className="truncate text-xs text-muted-foreground">{definition.description}</span>
				</div>
				<SaveStatus status={status} error={error} onRetry={retry} />
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={`Remove the ${definition.label} block`}
							disabled={isDeleting}
							className="text-muted-foreground hover:text-destructive"
						>
							<Trash2Icon />
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Remove the {definition.label} block?</AlertDialogTitle>
							<AlertDialogDescription>
								Its heading and text are deleted. Anything it only displays — events, milestones,
								the RSVP deadline — stays where it is.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Keep it</AlertDialogCancel>
							<AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>

			<CardContent className="flex flex-col gap-4 px-4 py-4">
				{fields.title && (
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={`${anchorId}-title`}>{definition.titleLabel ?? "Heading"}</Label>
						<Input
							id={`${anchorId}-title`}
							value={translation.title}
							placeholder={definition.builtIn ? "Leave empty for the default" : ""}
							onChange={(event) => updateTranslation({ title: event.target.value })}
						/>
					</div>
				)}

				{fields.body && (
					<div className="flex flex-col gap-1.5">
						<RichTextEditor
							label={definition.bodyLabel ?? "Text"}
							value={translation.body}
							onChange={(html) => updateTranslation({ body: html })}
						/>
					</div>
				)}

				{fields.image && (
					<ImageField
						label="Photo"
						value={state.imageUrl}
						onChange={(url) => setState((current) => ({ ...current, imageUrl: url }))}
						blobConfigured={blobConfigured}
						aiConfigured={aiConfigured}
						illustrate={illustrate}
					/>
				)}

				{fields.images && (
					<ImageListField
						label="Photos"
						values={state.imageUrls}
						onChange={(urls) => setState((current) => ({ ...current, imageUrls: urls }))}
						blobConfigured={blobConfigured}
						aiConfigured={aiConfigured}
						illustrate={illustrate}
					/>
				)}

				{fields.pageLink && (
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={`${anchorId}-target`}>Links to</Label>
						<Select
							value={state.url}
							onValueChange={(value) => setState((current) => ({ ...current, url: value }))}
						>
							<SelectTrigger id={`${anchorId}-target`}>
								<SelectValue placeholder="Pick a page" />
							</SelectTrigger>
							<SelectContent>
								{pageOptions.map((option) => (
									<SelectItem key={option.id} value={option.path}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				{fields.items && (
					<ItemList
						items={state.items}
						locale={locale}
						blobConfigured={blobConfigured}
						aiConfigured={aiConfigured}
						isFaq={block.type === BlockType.FAQ}
						onChange={(items) => setState((current) => ({ ...current, items }))}
						onItemChange={updateItem}
						onItemTranslationChange={updateItemTranslation}
					/>
				)}

				{fields.anchor && (
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={anchorId}>Menu anchor</Label>
						<Input
							id={anchorId}
							value={state.anchor}
							placeholder="Leave empty to keep it out of the menu"
							onChange={(event) =>
								setState((current) => ({ ...current, anchor: event.target.value }))
							}
						/>
						<p className="text-xs text-muted-foreground">
							The link in the top bar jumps here. Empty means the block still shows, just without a
							menu entry.
						</p>
					</div>
				)}

				{BUILT_IN_SOURCES[block.type] && (
					<p className="text-xs text-muted-foreground">
						<Link
							href={BUILT_IN_SOURCES[block.type]?.href ?? "#"}
							className="underline underline-offset-2"
						>
							{BUILT_IN_SOURCES[block.type]?.label}
						</Link>
					</p>
				)}
			</CardContent>

			<div className="flex justify-center border-t px-4 py-1.5">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="text-muted-foreground"
					onClick={() => onAddBelow(block.id)}
				>
					<PlusIcon aria-hidden="true" />
					Add a block here
				</Button>
			</div>
		</Card>
	);
}

function ItemList({
	items,
	locale,
	blobConfigured,
	aiConfigured,
	isFaq,
	onChange,
	onItemChange,
	onItemTranslationChange,
}: {
	items: BlockItemState[];
	locale: Locale;
	blobConfigured: boolean;
	aiConfigured: boolean;
	isFaq: boolean;
	onChange: (items: BlockItemState[]) => void;
	onItemChange: (key: string, patch: Partial<Omit<BlockItemState, "translations">>) => void;
	onItemTranslationChange: (key: string, patch: { title?: string; body?: string }) => void;
}) {
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);
	const dndId = useId();

	function handleDragEnd({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) {
			return;
		}
		const from = items.findIndex((item) => item.key === active.id);
		const to = items.findIndex((item) => item.key === over.id);
		if (from !== -1 && to !== -1) {
			onChange(arrayMove(items, from, to));
		}
	}

	function addItem() {
		// The id is minted here rather than by the database, so the very first save is already an
		// upsert against a stable row: without it every later save would delete and recreate the
		// item, churning the id the public page renders.
		const id = crypto.randomUUID();
		onChange([
			...items,
			{
				id,
				key: id,
				url: "",
				imageUrl: "",
				translations: (["en", "de", "ku"] as Locale[]).map((code) => ({
					locale: code,
					title: "",
					body: "",
				})),
			},
		]);
	}

	return (
		<div className="flex flex-col gap-2">
			<Label>{isFaq ? "Questions" : "Cards"}</Label>
			<DndContext
				id={dndId}
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={items.map((item) => item.key)}
					strategy={verticalListSortingStrategy}
				>
					<div className="flex flex-col gap-2">
						{items.map((item) => (
							<ItemRow
								key={item.key}
								item={item}
								locale={locale}
								blobConfigured={blobConfigured}
								aiConfigured={aiConfigured}
								isFaq={isFaq}
								onChange={onItemChange}
								onTranslationChange={onItemTranslationChange}
								onRemove={() => onChange(items.filter((entry) => entry.key !== item.key))}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>
			<Button type="button" variant="secondary" size="sm" className="self-start" onClick={addItem}>
				<PlusIcon aria-hidden="true" />
				{isFaq ? "Add a question" : "Add a card"}
			</Button>
		</div>
	);
}

function ItemRow({
	item,
	locale,
	blobConfigured,
	aiConfigured,
	isFaq,
	onChange,
	onTranslationChange,
	onRemove,
}: {
	item: BlockItemState;
	locale: Locale;
	blobConfigured: boolean;
	aiConfigured: boolean;
	isFaq: boolean;
	onChange: (key: string, patch: Partial<Omit<BlockItemState, "translations">>) => void;
	onTranslationChange: (key: string, patch: { title?: string; body?: string }) => void;
	onRemove: () => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.key,
	});
	const fieldId = useId();
	const translation = item.translations.find((entry) => entry.locale === locale) ?? {
		locale,
		title: "",
		body: "",
	};

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={cn(
				"flex flex-col gap-3 rounded-lg border bg-background p-3",
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
				<Input
					id={`${fieldId}-title`}
					value={translation.title}
					placeholder={isFaq ? "Question" : "Title"}
					onChange={(event) => onTranslationChange(item.key, { title: event.target.value })}
				/>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="Remove"
					className="text-muted-foreground hover:text-destructive"
					onClick={onRemove}
				>
					<Trash2Icon />
				</Button>
			</div>
			<RichTextEditor
				label={isFaq ? "Answer" : "Text"}
				value={translation.body}
				placeholder={isFaq ? "Answer" : "Text"}
				onChange={(html) => onTranslationChange(item.key, { body: html })}
			/>
			{!isFaq && (
				<>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={`${fieldId}-url`}>Link (optional)</Label>
						<Input
							id={`${fieldId}-url`}
							value={item.url}
							placeholder="https://"
							onChange={(event) => onChange(item.key, { url: event.target.value })}
						/>
					</div>
					<ImageField
						label="Photo"
						value={item.imageUrl}
						onChange={(url) => onChange(item.key, { imageUrl: url })}
						blobConfigured={blobConfigured}
						aiConfigured={aiConfigured}
						illustrate={{
							placement: "ITEM",
							title: translation.title,
							body: translation.body,
						}}
					/>
				</>
			)}
		</div>
	);
}
