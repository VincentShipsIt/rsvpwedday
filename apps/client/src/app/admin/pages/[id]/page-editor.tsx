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
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ExternalLinkIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { BlockCard } from "@/app/admin/pages/[id]/block-card";
import type { BlockState, PageOption } from "@/app/admin/pages/[id]/block-types";
import { createBlock, reorderBlocks, updatePageSettings } from "@/app/admin/pages/actions";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BLOCK_DEFINITIONS, BLOCK_TYPES } from "@/domain/blocks";
import type { BlockType, Locale } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";

export type PageEditorProps = {
	page: {
		id: string;
		slug: string;
		isHome: boolean;
		showInNav: boolean;
		path: string;
		translations: { locale: Locale; title: string; intro: string }[];
	};
	blocks: BlockState[];
	pageOptions: PageOption[];
	blobConfigured: boolean;
	aiConfigured: boolean;
};

// The block editor. One language switcher at the top drives every block below it, blocks reorder
// by dragging their handle, and each block saves itself — so a slow save on one block can never
// overwrite an edit in another, which is what the old whole-page forms did.
export function PageEditor({
	page,
	blocks: initialBlocks,
	pageOptions,
	blobConfigured,
	aiConfigured,
}: PageEditorProps) {
	const [locale, setLocale] = useState<Locale>(localeCodes[0]);
	const [blocks, setBlocks] = useState(initialBlocks);
	const [addAfter, setAddAfter] = useState<string | null>(null);
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [addError, setAddError] = useState<string | null>(null);
	const [isAdding, startAdding] = useTransition();

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);
	const dndId = useId();

	function handleDragEnd({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) {
			return;
		}
		const from = blocks.findIndex((block) => block.id === active.id);
		const to = blocks.findIndex((block) => block.id === over.id);
		if (from === -1 || to === -1) {
			return;
		}
		const next = arrayMove(blocks, from, to);
		setBlocks(next);
		reorderBlocks({ pageId: page.id, ids: next.map((block) => block.id) });
	}

	function openAdd(afterBlockId: string | null) {
		setAddAfter(afterBlockId);
		setAddError(null);
		setIsAddOpen(true);
	}

	function addBlock(type: BlockType) {
		startAdding(async () => {
			const result = await createBlock({
				pageId: page.id,
				type,
				afterBlockId: addAfter ?? undefined,
			});
			if (!result.ok) {
				setAddError(result.error);
				return;
			}
			const created = result.block;
			if (created) {
				setBlocks((current) => {
					const next = [...current];
					next.splice(result.position ?? next.length, 0, created);
					return next;
				});
			}
			setIsAddOpen(false);
		});
	}

	const usedBuiltIns = new Set(
		blocks.filter((block) => BLOCK_DEFINITIONS[block.type].builtIn).map((block) => block.type)
	);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Tabs value={locale} onValueChange={(value) => setLocale(value as Locale)}>
					<TabsList>
						{localeCodes.map((code) => (
							<TabsTrigger key={code} value={code}>
								{locales[code].label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
				<Button variant="ghost" size="sm" asChild>
					<Link href={page.path} target="_blank" rel="noreferrer">
						<ExternalLinkIcon aria-hidden="true" />
						View page
					</Link>
				</Button>
			</div>

			<PageSettingsCard page={page} locale={locale} />

			<DndContext
				id={dndId}
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={blocks.map((block) => block.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="flex flex-col gap-3">
						{blocks.map((block) => (
							<BlockCard
								key={block.id}
								block={block}
								locale={locale}
								blobConfigured={blobConfigured}
								aiConfigured={aiConfigured}
								pageOptions={pageOptions}
								onRemoved={(id) =>
									setBlocks((current) => current.filter((entry) => entry.id !== id))
								}
								onAddBelow={openAdd}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>

			<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
				<DialogTrigger asChild>
					<Button type="button" variant="secondary" onClick={() => openAdd(null)}>
						<PlusIcon aria-hidden="true" />
						Add a block
					</Button>
				</DialogTrigger>
				<DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Add a block</DialogTitle>
						<DialogDescription>
							{addAfter ? "It goes in right below that block." : "It goes at the end of the page."}
						</DialogDescription>
					</DialogHeader>
					{addError && <p className="text-sm text-destructive">{addError}</p>}
					<div className="flex flex-col gap-2">
						{BLOCK_TYPES.map((type) => {
							const definition = BLOCK_DEFINITIONS[type];
							const alreadyUsed = definition.builtIn && usedBuiltIns.has(type);
							return (
								<Button
									key={type}
									type="button"
									variant="outline"
									disabled={alreadyUsed || isAdding}
									className="h-auto flex-col items-start gap-0.5 whitespace-normal px-3 py-2 text-left"
									onClick={() => addBlock(type)}
								>
									<span className="text-sm font-medium">{definition.label}</span>
									<span className="text-xs font-normal text-muted-foreground">
										{alreadyUsed ? "Already on this page" : definition.description}
									</span>
								</Button>
							);
						})}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function PageSettingsCard({ page, locale }: { page: PageEditorProps["page"]; locale: Locale }) {
	const slugId = useId();
	const [slug, setSlug] = useState(page.slug);
	const [showInNav, setShowInNav] = useState(page.showInNav);
	const [translations, setTranslations] = useState(page.translations);

	const { status, error, retry } = useAutosave({
		value: { slug, showInNav, translations },
		save: (value) => updatePageSettings({ id: page.id, ...value }),
	});

	const translation = translations.find((entry) => entry.locale === locale) ?? {
		locale,
		title: "",
		intro: "",
	};

	function updateTranslation(patch: { title?: string; intro?: string }) {
		setTranslations((current) =>
			current.map((entry) => (entry.locale === locale ? { ...entry, ...patch } : entry))
		);
	}

	// The home page has no title or intro of its own — its hero block opens it — and its path is
	// fixed, so it only carries blocks.
	if (page.isHome) {
		return null;
	}

	return (
		<Card>
			<CardContent className="flex flex-col gap-4">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor={`${slugId}-title`}>Page title</Label>
					<Input
						id={`${slugId}-title`}
						value={translation.title}
						onChange={(event) => updateTranslation({ title: event.target.value })}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<RichTextEditor
						label="Intro"
						value={translation.intro}
						onChange={(html) => updateTranslation({ intro: html })}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor={slugId}>Address</Label>
					<Input id={slugId} value={slug} onChange={(event) => setSlug(event.target.value)} />
					<p className="text-xs text-muted-foreground">The page lives at /{slug}</p>
				</div>
				<div className="flex items-center gap-2">
					<Checkbox
						id={`${slugId}-nav`}
						checked={showInNav}
						onCheckedChange={(checked) => setShowInNav(checked === true)}
					/>
					<Label htmlFor={`${slugId}-nav`} className="font-normal">
						Show a link to this page in the footer
					</Label>
				</div>
				<div className="flex items-center gap-3">
					<Button type="button" variant="secondary" disabled={status === "saving"} onClick={retry}>
						Save now
					</Button>
					<SaveStatus status={status} error={error} onRetry={retry} />
				</div>
			</CardContent>
		</Card>
	);
}
