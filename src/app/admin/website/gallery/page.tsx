import { GalleryForm } from "@/app/admin/website/gallery/gallery-form";
import { WebsiteNav } from "@/app/admin/website/website-nav";
import { isBlobConfigured } from "@/lib/blob";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
	const siteContent = await db.siteContent.findUnique({ where: { id: 1 } });

	return (
		<div className="flex flex-col gap-6">
			<WebsiteNav current="/admin/website/gallery" />
			<h1 className="text-2xl font-medium">Gallery</h1>
			<GalleryForm
				initialGalleryUrls={siteContent?.galleryUrls ?? []}
				blobConfigured={isBlobConfigured()}
			/>
		</div>
	);
}
