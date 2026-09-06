"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateGallery } from "@/app/admin/website/actions";
import { ImageListField } from "@/components/admin/image-list-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type GalleryFormProps = {
	initialGalleryUrls: string[];
	blobConfigured: boolean;
};

export function GalleryForm({ initialGalleryUrls, blobConfigured }: GalleryFormProps) {
	const router = useRouter();
	const [galleryUrls, setGalleryUrls] = useState(initialGalleryUrls);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	function handleSave() {
		setError(null);
		startTransition(async () => {
			const result = await updateGallery({
				galleryUrls: galleryUrls.filter((url) => url.trim().length > 0),
			});
			if (!result.ok) {
				setError(result.error);
				return;
			}
			toast.success("Gallery saved");
			router.refresh();
		});
	}

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

			{error && <p className="text-sm text-destructive">{error}</p>}

			<Button type="button" disabled={isPending} onClick={handleSave} className="self-start">
				Save gallery
			</Button>
		</div>
	);
}
