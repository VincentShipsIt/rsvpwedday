"use client";

import { useState } from "react";
import { updateGallery } from "@/app/admin/website/actions";
import { ImageListField } from "@/components/admin/image-list-field";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type GalleryFormProps = {
	initialGalleryUrls: string[];
	blobConfigured: boolean;
};

export function GalleryForm({ initialGalleryUrls, blobConfigured }: GalleryFormProps) {
	const [galleryUrls, setGalleryUrls] = useState(initialGalleryUrls);

	const { status, error, retry } = useAutosave({
		value: galleryUrls,
		save: (urls) => updateGallery({ galleryUrls: urls.filter((url) => url.trim().length > 0) }),
	});

	return (
		<div className="flex flex-col gap-8">
			<Card>
				<CardContent>
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
