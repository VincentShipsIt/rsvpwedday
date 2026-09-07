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
import { ChevronRightIcon, GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { createPage, deletePage, reorderPages } from "@/app/admin/pages/actions";
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
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type PageRow = {
	id: string;
	slug: string;
	isHome: boolean;
	label: string;
	path: string;
	blockCount: number;
};

// The site's pages, in the order their links appear in the footer. Dragging a row reorders that
// list; the home page sits first and cannot be dragged away or deleted.
export function PagesList({ pages: initialPages }: { pages: PageRow[] }) {
	const router = useRouter();
	const [pages, setPages] = useState(initialPages);
	const [isOpen, setIsOpen] = useState(false);
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isCreating, startCreating] = useTransition();
	const nameId = useId();
	const dndId = useId();

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	function handleDragEnd({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) {
			return;
		}
		const from = pages.findIndex((page) => page.id === active.id);
		const to = pages.findIndex((page) => page.id === over.id);
		if (from === -1 || to === -1) {
			return;
		}
		const next = arrayMove(pages, from, to);
		setPages(next);
		reorderPages(next.map((page) => page.id));
	}

	function create() {
		startCreating(async () => {
			const result = await createPage({ slug: name });
			if (!result.ok) {
				setError(result.error);
				return;
			}
			setIsOpen(false);
			setName("");
			router.push(`/admin/pages/${result.id}`);
		});
	}

	return (
		<div className="flex flex-col gap-4">
			<DndContext
				id={dndId}
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={pages.map((page) => page.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="flex flex-col gap-2">
						{pages.map((page) => (
							<PageRowCard
								key={page.id}
								page={page}
								onRemoved={(id) =>
									setPages((current) => current.filter((entry) => entry.id !== id))
								}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogTrigger asChild>
					<Button type="button" variant="secondary" className="self-start">
						<PlusIcon aria-hidden="true" />
						New page
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New page</DialogTitle>
						<DialogDescription>
							Give it a name; you can add blocks and change the address afterwards.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={nameId}>Name</Label>
						<Input
							id={nameId}
							value={name}
							placeholder="Travel guide"
							onChange={(event) => setName(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									create();
								}
							}}
						/>
						{error && <p className="text-sm text-destructive">{error}</p>}
					</div>
					<DialogFooter>
						<Button type="button" disabled={isCreating || !name.trim()} onClick={create}>
							Create
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function PageRowCard({ page, onRemoved }: { page: PageRow; onRemoved: (id: string) => void }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: page.id,
		disabled: page.isHome,
	});
	const [isDeleting, setIsDeleting] = useState(false);

	async function handleDelete() {
		setIsDeleting(true);
		const result = await deletePage(page.id);
		if (result.ok) {
			onRemoved(page.id);
		} else {
			setIsDeleting(false);
		}
	}

	return (
		<Card
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={cn(
				"flex-row items-center gap-2 px-3 py-2",
				isDragging && "z-10 shadow-lg ring-2 ring-ring"
			)}
		>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				aria-label={`Reorder ${page.label}`}
				disabled={page.isHome}
				className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
				{...attributes}
				{...listeners}
			>
				<GripVerticalIcon />
			</Button>
			<Link href={`/admin/pages/${page.id}`} className="flex min-w-0 flex-1 flex-col">
				<span className="truncate text-sm font-medium">{page.label}</span>
				<span className="truncate text-xs text-muted-foreground">
					{page.path} · {page.blockCount} block{page.blockCount === 1 ? "" : "s"}
				</span>
			</Link>
			{!page.isHome && (
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={`Delete ${page.label}`}
							disabled={isDeleting}
							className="text-muted-foreground hover:text-destructive"
						>
							<Trash2Icon />
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete {page.label}?</AlertDialogTitle>
							<AlertDialogDescription>
								The page and every block on it are removed, and {page.path} stops working. This
								can't be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Keep it</AlertDialogCancel>
							<AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
			<ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
		</Card>
	);
}
