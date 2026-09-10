"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/*
 * Every image in the admin is a small square thumbnail — a field preview, a gallery tile, a
 * guest's photo — because a list of pictures is only readable when the pictures are the same
 * size. This is where one is actually looked at: the whole file, uncropped and at its own
 * proportions, capped to the viewport.
 *
 * The trigger stays the caller's. A field's preview and a draggable gallery tile look nothing
 * alike, and the tile's own click already belongs to dnd-kit.
 */
export function ImageLightbox({
	url,
	title,
	trigger,
}: {
	url: string;
	title: string;
	trigger: ReactNode;
}) {
	return (
		<Dialog>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent
				aria-describedby={undefined}
				className="w-auto max-w-[calc(100%-2rem)] justify-items-center gap-3 sm:max-w-3xl"
			>
				<DialogTitle className="justify-self-start pr-8">{title}</DialogTitle>
				{/* biome-ignore lint/performance/noImgElement: admin-only view of an arbitrary, unconfigured external URL, not a next/image candidate. */}
				<img
					src={url}
					alt=""
					className="max-h-[70vh] w-auto max-w-full rounded-md object-contain"
				/>
			</DialogContent>
		</Dialog>
	);
}

/** The square thumbnail every admin image preview opens its lightbox from. */
export function ImageThumbnail({ url, label }: { url: string; label: string }) {
	return (
		<Button
			type="button"
			variant="ghost"
			aria-label={`View ${label} full size`}
			className="group relative size-24 shrink-0 cursor-zoom-in overflow-hidden rounded-md border bg-muted p-0 hover:bg-muted"
		>
			{/* biome-ignore lint/performance/noImgElement: admin-only thumbnail of an arbitrary, unconfigured external URL. */}
			<img src={url} alt="" className="size-full object-cover" draggable={false} />
			<span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />
		</Button>
	);
}
