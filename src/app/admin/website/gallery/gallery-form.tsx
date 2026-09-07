"use client";

import { useState } from "react";
import { updateGallery } from "@/app/admin/website/actions";
import { ImageListField } from "@/components/admin/image-list-field";
import { SaveStatus } from "@/components/admin/save-status";
import {
	SectionHeadingField,
	type SectionHeadingState,
} from "@/components/admin/section-heading-field";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/generated/prisma/enums";

export type GalleryFormProps = {
	initialHeadings: SectionHeadingState[];
	headingDefaults: Record<Locale, string>;
	initialGalleryUrls: string[];
	blobConfigured: boolean;
};

export function GalleryForm({
	initialHeadings,
	headingDefaults,
	initialGalleryUrls,
	blobConfigured,
}: GalleryFormProps) {
	const [headings, setHeadings] = useState(initialHeadings);
	const [galleryUrls, setGalleryUrls] = useState(initialGalleryUrls);

	const { status, error, retry } = useAutosave({
		value: { headings, galleryUrls },
		save: ({ headings: nextHeadings, galleryUrls: urls }) =>
			updateGallery({
				headings: nextHeadings,
				galleryUrls: urls.filter((url) => url.trim().length > 0),
			}),
	});

	function updateHeading(locale: Locale, heading: string) {
		setHeadings((current) =>
			current.map((entry) => (entry.locale === locale ? { ...entry, heading } : entry))
		);
	}

	return (
		<div className="flex flex-col gap-8">
			<Card>
				<CardContent className="flex flex-col gap-4">
					<SectionHeadingField
						values={headings}
						defaults={headingDefaults}
						onChange={updateHeading}
					/>
					<ImageListField
						label="Gallery photos"
						values={galleryUrls}
						onChange={setGalleryUrls}
						blobConfigured={blobConfigured}
					/>
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
