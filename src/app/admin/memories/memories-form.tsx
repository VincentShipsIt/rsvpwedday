"use client";

import { useId, useState } from "react";
import { type MemoriesTranslationInput, updateMemories } from "@/app/admin/memories/actions";
import { DateTimeField } from "@/components/admin/date-time-field";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";

export type MemoriesFormProps = {
	initialEnabled: boolean;
	initialOpenAt: string;
	initialTestMode: boolean;
	/** Offered as a one-click default: the book almost always opens on the wedding day itself. */
	weddingDate: string;
	initialTranslations: MemoriesTranslationInput[];
};

export function MemoriesForm({
	initialEnabled,
	initialOpenAt,
	initialTestMode,
	weddingDate,
	initialTranslations,
}: MemoriesFormProps) {
	const enabledId = useId();
	const testModeId = useId();
	const [photosEnabled, setPhotosEnabled] = useState(initialEnabled);
	const [photosOpenAt, setPhotosOpenAt] = useState(initialOpenAt);
	const [photosTestMode, setPhotosTestMode] = useState(initialTestMode);
	const [translations, setTranslations] = useState(initialTranslations);

	const { status, error, retry } = useAutosave({
		value: { photosEnabled, photosOpenAt, photosTestMode, translations },
		save: (value) => updateMemories(value),
	});

	function updateTranslation(locale: Locale, patch: Partial<MemoriesTranslationInput>) {
		setTranslations((current) =>
			current.map((translation) =>
				translation.locale === locale ? { ...translation, ...patch } : translation
			)
		);
	}

	return (
		<div className="flex flex-col gap-8">
			<Card>
				<CardContent className="flex items-center justify-between gap-6">
					<div className="grid gap-1">
						<Label htmlFor={enabledId} className="text-base">
							The memories book
						</Label>
						<p className="text-xs text-muted-foreground">
							Off, the page does not exist: guests get a 404 and their invitation says nothing about
							photos.
						</p>
					</div>
					<Switch id={enabledId} checked={photosEnabled} onCheckedChange={setPhotosEnabled} />
				</CardContent>
			</Card>

			<Card className={photosEnabled ? undefined : "pointer-events-none opacity-50"}>
				<CardHeader>
					<CardTitle>When it opens</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-5">
					<div className="flex flex-col gap-2">
						<DateTimeField
							label="Uploads open at"
							value={photosOpenAt}
							onChange={setPhotosOpenAt}
							clearable
							description="Before this moment guests see the date instead of the camera. Leave it empty to open the book as soon as it is switched on."
						/>
						{weddingDate && photosOpenAt !== weddingDate && (
							<Button
								type="button"
								variant="secondary"
								size="sm"
								className="self-start"
								onClick={() => setPhotosOpenAt(weddingDate)}
							>
								Open it on the wedding day
							</Button>
						)}
					</div>

					<div className="flex items-center justify-between gap-6 rounded-lg border border-dashed p-4">
						<div className="grid gap-1">
							<Label htmlFor={testModeId}>Open it now, for testing</Label>
							<p className="text-xs text-muted-foreground">
								Ignores the date above without changing it, so you can take a few photos and try the
								book out before the day. Remember to switch it back off.
							</p>
						</div>
						<Switch id={testModeId} checked={photosTestMode} onCheckedChange={setPhotosTestMode} />
					</div>
				</CardContent>
			</Card>

			<Card className={photosEnabled ? undefined : "pointer-events-none opacity-50"}>
				<CardHeader>
					<CardTitle>Cover and opening note</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue={localeCodes[0]}>
						<TabsList>
							{localeCodes.map((code) => (
								<TabsTrigger key={code} value={code}>
									{locales[code].label}
								</TabsTrigger>
							))}
						</TabsList>
						{translations.map((translation) => (
							<TabsContent
								key={translation.locale}
								value={translation.locale}
								className="flex flex-col gap-4 pt-4"
							>
								<div className="grid gap-2">
									<Label>Title on the cover</Label>
									<Input
										placeholder="The memories book"
										value={translation.photosTitle}
										onChange={(event) =>
											updateTranslation(translation.locale, { photosTitle: event.target.value })
										}
									/>
								</div>
								<div className="grid gap-2">
									<Label>Opening note</Label>
									<Textarea
										rows={4}
										placeholder="Left empty, the book goes straight from the cover to the photos."
										value={translation.photosIntro}
										onChange={(event) =>
											updateTranslation(translation.locale, { photosIntro: event.target.value })
										}
									/>
								</div>
							</TabsContent>
						))}
					</Tabs>
				</CardContent>
			</Card>

			<div className="flex items-center gap-3">
				<Button type="button" variant="secondary" disabled={status === "saving"} onClick={retry}>
					Save now
				</Button>
				<SaveStatus status={status} error={error} onRetry={retry} />
			</div>
		</div>
	);
}
