"use client";

import { EyeIcon, EyeOffIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { toast } from "sonner";
import { deletePhoto, setPhotoHidden } from "@/app/admin/memories/actions";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type ModeratedPhoto = {
	id: string;
	url: string;
	uploaderName: string;
	caption: string;
	household: string;
	createdAt: string;
	isHidden: boolean;
};

const REFRESH_MS = 15_000;

/*
 * Every photo any guest has added, newest first. Hiding is the reversible one and is a single
 * click; deleting removes the file from the Blob store too, so it asks first.
 *
 * While the book is open this refetches every fifteen seconds, so the couple can leave this page
 * up during the party and watch photos arrive instead of reloading. A closed book cannot gain
 * photos, so it does not poll.
 */
export function PhotoModeration({
	photos,
	isBookOpen,
}: {
	photos: ModeratedPhoto[];
	isBookOpen: boolean;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		if (!isBookOpen) {
			return;
		}
		const timer = window.setInterval(() => {
			// Skip the poll while the tab is in the background: a phone left open in a pocket has no
			// use for it, and it comes back current on the next tick anyway.
			if (document.visibilityState === "visible") {
				router.refresh();
			}
		}, REFRESH_MS);
		return () => window.clearInterval(timer);
	}, [isBookOpen, router]);

	function toggleHidden(photo: ModeratedPhoto) {
		startTransition(async () => {
			const result = await setPhotoHidden(photo.id, !photo.isHidden);
			if (!result.ok) {
				toast.error(result.error);
			}
		});
	}

	function remove(photo: ModeratedPhoto) {
		startTransition(async () => {
			const result = await deletePhoto(photo.id);
			if (result.ok) {
				toast.success("Photo deleted");
			} else {
				toast.error(result.error);
			}
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Guest photos{photos.length > 0 ? ` (${photos.length})` : ""}</CardTitle>
				{isBookOpen && (
					<CardDescription>
						New photos appear here on their own while the book is open.
					</CardDescription>
				)}
			</CardHeader>
			<CardContent>
				{photos.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						{isBookOpen
							? "No photos yet. They appear here the moment a guest adds one."
							: "No photos yet. Guests can add them once the book opens."}
					</p>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{photos.map((photo) => (
							<div key={photo.id} className="flex flex-col gap-2 rounded-lg border p-3">
								<div className="relative aspect-square overflow-hidden rounded-md bg-muted">
									{/* biome-ignore lint/performance/noImgElement: admin-only thumbnail of an arbitrary Blob URL. */}
									<img
										src={photo.url}
										alt={photo.caption}
										className={`size-full object-cover ${photo.isHidden ? "opacity-40" : ""}`}
									/>
									{photo.isHidden && (
										<Badge variant="secondary" className="absolute left-2 top-2">
											Hidden
										</Badge>
									)}
								</div>
								<div className="grid gap-0.5 text-xs">
									{photo.caption && <p className="text-foreground">{photo.caption}</p>}
									<p className="text-muted-foreground">
										{photo.uploaderName || "Unnamed"} · {photo.household}
									</p>
									<p className="text-muted-foreground">
										{new Date(photo.createdAt).toLocaleString()}
									</p>
								</div>
								<div className="flex items-center gap-1">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										disabled={isPending}
										onClick={() => toggleHidden(photo)}
									>
										{photo.isHidden ? <EyeIcon /> : <EyeOffIcon />}
										{photo.isHidden ? "Show" : "Hide"}
									</Button>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="ml-auto"
												disabled={isPending}
												aria-label="Delete photo"
											>
												<Trash2Icon />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Delete this photo?</AlertDialogTitle>
												<AlertDialogDescription>
													The file is removed from storage as well, so this cannot be undone. To
													take it out of the book but keep it, hide it instead.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction onClick={() => remove(photo)}>Delete</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
