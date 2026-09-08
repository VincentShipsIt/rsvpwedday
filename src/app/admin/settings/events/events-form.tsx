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
import { GripVerticalIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import { updateEvents } from "@/app/admin/settings/site-actions";
import { DateTimeField } from "@/components/admin/date-time-field";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dayOffset, describeDayOffset } from "@/domain/wedding-date";
import type { Locale } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";
import { cn } from "@/lib/utils";
import { parseWireDate } from "@/lib/wire-date";

function createKey(): string {
	return crypto.randomUUID();
}

/*
 * Where this event sits against the wedding day, written under its start date. A raw timestamp
 * hides a mistyped month or year; "364 days before" does not.
 */
function relativeToWedding(
	startsAt: string,
	weddingDate: string,
	timeZone: string
): string | undefined {
	const start = parseWireDate(startsAt, timeZone);
	const wedding = parseWireDate(weddingDate, timeZone);
	if (!start || !wedding) {
		return undefined;
	}
	return describeDayOffset(dayOffset(start, wedding, timeZone));
}

function emptyTranslations(): TranslationState[] {
	return localeCodes.map((code) => ({ locale: code, name: "", description: "" }));
}

type TranslationState = { locale: Locale; name: string; description: string };

type EventState = {
	key: string;
	id: string;
	attendanceCount?: number;
	slug: string;
	startsAt: string;
	endsAt: string;
	venue: string;
	address: string;
	mapsUrl: string;
	dressCode: string;
	sortOrder: number;
	showPublicly: boolean;
	translations: TranslationState[];
};

export type EventsFormProps = {
	/** The wedding day, so each event can say where it falls relative to it. */
	weddingDate: string;
	timeZone: string;
	initialEvents: Omit<EventState, "key">[];
};

export function EventsForm({ weddingDate, timeZone, initialEvents }: EventsFormProps) {
	const [events, setEvents] = useState<EventState[]>(() =>
		initialEvents.map((event) => ({ ...event, key: event.id ?? createKey() }))
	);
	const dndId = useId();

	const [deletedEventIds, setDeletedEventIds] = useState<string[]>([]);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	// The order on screen is the order that is saved: `sortOrder` is the row's index rather than a
	// number anyone types, so two events can never claim the same position.
	const { status, error, retry } = useAutosave({
		value: { events, deletedEventIds },
		save: ({ events: nextEvents, deletedEventIds: removed }) =>
			updateEvents({
				events: nextEvents.map(({ key, attendanceCount, ...event }, sortOrder) => ({
					...event,
					sortOrder,
				})),
				deletedEventIds: removed,
			}),
	});

	function addEvent() {
		const id = createKey();
		setEvents((current) => [
			...current,
			{
				key: id,
				id,
				slug: "",
				startsAt: "",
				endsAt: "",
				venue: "",
				address: "",
				mapsUrl: "",
				dressCode: "",
				sortOrder: current.length,
				showPublicly: true,
				translations: emptyTranslations(),
			},
		]);
	}

	function removeEvent(key: string) {
		const event = events.find((candidate) => candidate.key === key);
		if (event) setDeletedEventIds((current) => [...current, event.id]);
		setEvents((current) => current.filter((event) => event.key !== key));
	}

	function updateEvent(key: string, patch: Partial<EventState>) {
		setEvents((current) =>
			current.map((event) => (event.key === key ? { ...event, ...patch } : event))
		);
	}

	function updateTranslation(key: string, locale: Locale, patch: Partial<TranslationState>) {
		setEvents((current) =>
			current.map((event) =>
				event.key === key
					? {
							...event,
							translations: event.translations.map((translation) =>
								translation.locale === locale ? { ...translation, ...patch } : translation
							),
						}
					: event
			)
		);
	}

	function handleDragEnd({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) {
			return;
		}
		setEvents((current) => {
			const from = current.findIndex((event) => event.key === active.id);
			const to = current.findIndex((event) => event.key === over.id);
			return from === -1 || to === -1 ? current : arrayMove(current, from, to);
		});
	}

	return (
		<div className="flex flex-col gap-8">
			<DndContext
				id={dndId}
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={events.map((event) => event.key)}
					strategy={verticalListSortingStrategy}
				>
					<div className="flex flex-col gap-4">
						{events.map((event) => (
							<SortableEventCard
								key={event.key}
								eventKey={event.key}
								name={event.translations.find((entry) => entry.locale === "en")?.name ?? ""}
								slug={event.slug}
							>
								<div className="grid gap-2 sm:grid-cols-2">
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={`${event.key}-slug`}>Slug</Label>
										<Input
											id={`${event.key}-slug`}
											placeholder="Slug"
											value={event.slug}
											onChange={(changeEvent) =>
												updateEvent(event.key, { slug: changeEvent.target.value })
											}
										/>
									</div>
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={`${event.key}-dress-code`}>Dress code</Label>
										<Input
											id={`${event.key}-dress-code`}
											placeholder="Dress code"
											value={event.dressCode}
											onChange={(changeEvent) =>
												updateEvent(event.key, { dressCode: changeEvent.target.value })
											}
										/>
									</div>
									<DateTimeField
										label="Starts"
										value={event.startsAt}
										onChange={(value) => updateEvent(event.key, { startsAt: value })}
										description={relativeToWedding(event.startsAt, weddingDate, timeZone)}
									/>
									<DateTimeField
										label="Ends"
										value={event.endsAt}
										onChange={(value) => updateEvent(event.key, { endsAt: value })}
										clearable
									/>
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={`${event.key}-venue`}>Venue</Label>
										<Input
											id={`${event.key}-venue`}
											placeholder="Venue"
											value={event.venue}
											onChange={(changeEvent) =>
												updateEvent(event.key, { venue: changeEvent.target.value })
											}
										/>
									</div>
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={`${event.key}-address`}>Address</Label>
										<Input
											id={`${event.key}-address`}
											placeholder="Address"
											value={event.address}
											onChange={(changeEvent) =>
												updateEvent(event.key, { address: changeEvent.target.value })
											}
										/>
									</div>
									<div className="flex flex-col gap-1.5 sm:col-span-2">
										<Label htmlFor={`${event.key}-maps-url`}>Maps URL</Label>
										<Input
											className="sm:col-span-2"
											id={`${event.key}-maps-url`}
											placeholder="Maps URL"
											value={event.mapsUrl}
											onChange={(changeEvent) =>
												updateEvent(event.key, { mapsUrl: changeEvent.target.value })
											}
										/>
									</div>
								</div>

								<div className="flex items-start justify-between gap-4 rounded-lg border p-3">
									<div className="flex flex-col gap-0.5">
										<Label htmlFor={`${event.key}-public`}>Show on the website</Label>
										<p className="text-xs text-muted-foreground">
											{event.showPublicly
												? "Anyone visiting the site sees this event."
												: "Hidden from the public site. The guests invited to it still see it on their own invitation page and in their invitation email."}
										</p>
									</div>
									<Switch
										id={`${event.key}-public`}
										checked={event.showPublicly}
										onCheckedChange={(checked) => updateEvent(event.key, { showPublicly: checked })}
									/>
								</div>

								<Tabs defaultValue={localeCodes[0]}>
									<TabsList>
										{localeCodes.map((code) => (
											<TabsTrigger key={code} value={code}>
												{locales[code].label}
											</TabsTrigger>
										))}
									</TabsList>
									{event.translations.map((translation) => (
										<TabsContent
											key={translation.locale}
											value={translation.locale}
											className="flex flex-col gap-2"
										>
											<div className="flex flex-col gap-1.5">
												<Label htmlFor={`${event.key}-${translation.locale}-name`}>Name</Label>
												<Input
													id={`${event.key}-${translation.locale}-name`}
													placeholder="Name"
													value={translation.name}
													onChange={(changeEvent) =>
														updateTranslation(event.key, translation.locale, {
															name: changeEvent.target.value,
														})
													}
												/>
											</div>
											<RichTextEditor
												label={`Event description (${locales[translation.locale].label})`}
												placeholder="Description"
												value={translation.description}
												onChange={(html) =>
													updateTranslation(event.key, translation.locale, {
														description: html,
													})
												}
											/>
										</TabsContent>
									))}
								</Tabs>

								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button type="button" variant="ghost" size="sm" className="self-start">
											Remove event
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>
												Remove{" "}
												{event.translations.find((row) => row.name.trim())?.name ||
													event.slug ||
													"this event"}
												?
											</AlertDialogTitle>
											<AlertDialogDescription>
												This permanently removes the event and all its guest invitations and
												attendance responses
												{event.attendanceCount !== undefined
													? ` (${event.attendanceCount} guest records when this page loaded)`
													: ""}
												. Other events are kept.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancel</AlertDialogCancel>
											<AlertDialogAction onClick={() => removeEvent(event.key)}>
												Remove event
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</SortableEventCard>
						))}
					</div>
				</SortableContext>
			</DndContext>

			<Button type="button" variant="secondary" size="sm" className="self-start" onClick={addEvent}>
				Add event
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

/*
 * One event card, reordered by dragging its handle — the same gesture and the same library as the
 * page editor's blocks, so the two lists in the admin behave alike. The handle is its own button
 * rather than the whole card, because the card is full of text inputs a drag would otherwise
 * hijack.
 */
function SortableEventCard({
	eventKey,
	name,
	slug,
	children,
}: {
	eventKey: string;
	name: string;
	slug: string;
	children: ReactNode;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: eventKey,
	});

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
					aria-label={`Reorder ${name || slug || "this event"}`}
					className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
					{...attributes}
					{...listeners}
				>
					<GripVerticalIcon />
				</Button>
				<span className="min-w-0 flex-1 truncate text-sm font-medium">
					{name || slug || "New event"}
				</span>
			</div>
			<CardContent className="flex flex-col gap-4 px-4 py-4">{children}</CardContent>
		</Card>
	);
}
