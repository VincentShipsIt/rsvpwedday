"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { type BookPage, buildLeaves } from "@/domain/photo-book";
import type { Dictionary } from "@/i18n";
import { t } from "@/i18n";

const TURN_MS = 700;

export type PhotoBookProps = {
	pages: BookPage[];
	coupleNames: string;
	title: string;
	intro: string;
	photoCount: number;
	copy: Dictionary["photos"];
};

/*
 * The memories book: real page turning, no library.
 *
 * The trick is the same one a paper book uses. Every leaf is a sheet pinned at the spine, holding
 * one page on its front and the next on its back; turning it is a `rotateY(-180deg)` about that
 * left edge, and `backface-visibility: hidden` means the back face only becomes visible once the
 * sheet has passed halfway. Stacking order does the rest: unturned leaves stack toward the reader
 * from the top of the pile, turned ones stack away from it on the left.
 *
 * A phone is too narrow for two facing pages, so it gets one page per leaf instead and the turned
 * sheets swing out of the clipped viewport entirely — the same mechanism, half the spread.
 */
export function PhotoBook({ pages, coupleNames, title, intro, photoCount, copy }: PhotoBookProps) {
	const [isSpread, setIsSpread] = useState(false);
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
	const [turned, setTurned] = useState(0);
	const previousPhotoCount = useRef(photoCount);

	// Two facing pages need the room for them; below that the book runs one page at a time. Read
	// after mount so the server and the first client render agree on the single-page layout.
	useEffect(() => {
		const spreadQuery = window.matchMedia("(min-width: 768px)");
		const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		const sync = () => {
			setIsSpread(spreadQuery.matches);
			setPrefersReducedMotion(motionQuery.matches);
		};
		sync();
		spreadQuery.addEventListener("change", sync);
		motionQuery.addEventListener("change", sync);
		return () => {
			spreadQuery.removeEventListener("change", sync);
			motionQuery.removeEventListener("change", sync);
		};
	}, []);

	const leaves = buildLeaves(pages, isSpread ? 2 : 1);
	const lastLeaf = leaves.length;

	// Switching layouts halves or doubles the leaf count, so a reader deep in the book can end up
	// past its last sheet.
	useEffect(() => {
		setTurned((current) => Math.min(current, lastLeaf));
	}, [lastLeaf]);

	// A photo the guest just added lands at the back of the book; turn to it rather than leaving
	// them on the cover wondering whether it worked.
	useEffect(() => {
		if (photoCount > previousPhotoCount.current) {
			setTurned(Math.max(0, lastLeaf - 1));
		}
		previousPhotoCount.current = photoCount;
	}, [photoCount, lastLeaf]);

	const turnForward = useCallback(() => {
		setTurned((current) => Math.min(current + 1, lastLeaf - 1));
	}, [lastLeaf]);

	const turnBack = useCallback(() => {
		setTurned((current) => Math.max(current - 1, 0));
	}, []);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "ArrowRight") {
				turnForward();
			}
			if (event.key === "ArrowLeft") {
				turnBack();
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [turnForward, turnBack]);

	const transition = prefersReducedMotion
		? "none"
		: `transform ${TURN_MS}ms cubic-bezier(0.2, 0.7, 0.3, 1)`;
	const pagesPerLeaf = isSpread ? 2 : 1;
	const currentPage = Math.min(turned * pagesPerLeaf + 1, pages.length);

	return (
		<div className="flex flex-col items-center gap-6">
			<div
				className="relative w-full max-w-4xl overflow-hidden rounded-lg"
				style={{ perspective: "2200px" }}
			>
				{/* Portrait on a phone (one page), landscape on a desktop (two facing pages). */}
				<div className="relative aspect-[3/4] w-full md:aspect-[16/10]">
					{leaves.map((leaf, index) => {
						const isTurned = index < turned;
						return (
							<div
								key={`${describePage(leaf[0])}-${describePage(leaf[1])}`}
								className="absolute inset-y-0 right-0 w-full md:left-1/2 md:w-1/2"
								style={{
									transformOrigin: "left center",
									transformStyle: "preserve-3d",
									transform: isTurned ? "rotateY(-180deg)" : "rotateY(0deg)",
									transition,
									zIndex: isTurned ? index : leaves.length - index,
								}}
							>
								<Face
									page={leaf[0] ?? null}
									side="front"
									coupleNames={coupleNames}
									title={title}
									intro={intro}
									photoCount={photoCount}
									copy={copy}
								/>
								<Face
									page={leaf[1] ?? null}
									side="back"
									coupleNames={coupleNames}
									title={title}
									intro={intro}
									photoCount={photoCount}
									copy={copy}
								/>
							</div>
						);
					})}

					{/* Tapping the page itself is how people expect to turn one; the buttons below stay
					    for anyone using a keyboard or a screen reader. */}
					<button
						type="button"
						aria-label={copy.previousPage}
						onClick={turnBack}
						disabled={turned === 0}
						className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize disabled:cursor-default"
						style={{ zIndex: leaves.length + 1 }}
					/>
					<button
						type="button"
						aria-label={copy.nextPage}
						onClick={turnForward}
						disabled={turned >= lastLeaf - 1}
						className="absolute inset-y-0 right-0 w-1/3 cursor-e-resize disabled:cursor-default"
						style={{ zIndex: leaves.length + 1 }}
					/>
				</div>
			</div>

			<div className="flex items-center gap-4 text-sm">
				<button
					type="button"
					onClick={turnBack}
					disabled={turned === 0}
					className="underline underline-offset-4 disabled:opacity-40 disabled:no-underline"
				>
					{copy.previousPage}
				</button>
				<span className="tabular-nums text-ink/60">
					{t(copy.pageLabel, { current: currentPage, total: pages.length })}
				</span>
				<button
					type="button"
					onClick={turnForward}
					disabled={turned >= lastLeaf - 1}
					className="underline underline-offset-4 disabled:opacity-40 disabled:no-underline"
				>
					{copy.nextPage}
				</button>
			</div>
		</div>
	);
}

// The leaf's key. A leaf is identified by the pages it carries rather than its position, so
// switching between the one-page and two-page layouts re-mounts the faces instead of swapping one
// photo into another sheet mid-turn. Every page is unique: the cover, intro and end appear once,
// and a photo carries its own id.
function describePage(page: BookPage | null | undefined): string {
	if (!page) {
		return "blank";
	}
	return page.kind === "photo" ? page.photo.id : page.kind;
}

type FaceProps = {
	page: BookPage | null;
	side: "front" | "back";
	coupleNames: string;
	title: string;
	intro: string;
	photoCount: number;
	copy: Dictionary["photos"];
};

function Face({ page, side, coupleNames, title, intro, photoCount, copy }: FaceProps) {
	return (
		<div
			className="absolute inset-0 overflow-hidden bg-ivory"
			style={{
				backfaceVisibility: "hidden",
				transform: side === "back" ? "rotateY(180deg)" : undefined,
			}}
		>
			{/* The shading that falls into the gutter of an open book. It sits on the spine edge,
			    which is the left edge of a front face and the right edge of a back face. */}
			<div
				aria-hidden="true"
				className={`pointer-events-none absolute inset-y-0 w-8 ${
					side === "front"
						? "left-0 bg-gradient-to-r from-ink/15 to-transparent"
						: "right-0 bg-gradient-to-l from-ink/15 to-transparent"
				}`}
				style={{ zIndex: 2 }}
			/>
			<div className="flex h-full w-full flex-col ring-1 ring-ink/10">
				<PageContent
					page={page}
					coupleNames={coupleNames}
					title={title}
					intro={intro}
					photoCount={photoCount}
					copy={copy}
				/>
			</div>
		</div>
	);
}

function PageContent({
	page,
	coupleNames,
	title,
	intro,
	photoCount,
	copy,
}: Omit<FaceProps, "side">) {
	if (!page) {
		return <div className="h-full w-full bg-ivory-dark/30" />;
	}

	if (page.kind === "cover") {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
				<p className="text-sm uppercase tracking-[0.3em] text-ink/50">{coupleNames}</p>
				<h2 className="text-3xl font-medium sm:text-4xl">{title}</h2>
				<span aria-hidden="true" className="h-px w-16 bg-green/40" />
				<p className="text-sm text-ink/60">{copy.coverSubtitle}</p>
				{photoCount > 0 && (
					<p className="text-xs text-ink/50">{t(copy.countLabel, { count: photoCount })}</p>
				)}
			</div>
		);
	}

	if (page.kind === "intro") {
		return (
			<div className="flex h-full flex-col justify-center gap-4 px-8 sm:px-12">
				<p className="whitespace-pre-line text-base leading-relaxed text-ink/80">{intro}</p>
			</div>
		);
	}

	if (page.kind === "end") {
		const hasPhotos = photoCount > 0;
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
				<h3 className="text-2xl font-medium">{hasPhotos ? copy.endHeading : copy.emptyHeading}</h3>
				<p className="max-w-xs text-sm text-ink/70">{hasPhotos ? copy.endBody : copy.emptyBody}</p>
			</div>
		);
	}

	return (
		<figure className="flex h-full flex-col gap-3 p-4 sm:p-6">
			<div className="relative min-h-0 flex-1 overflow-hidden rounded bg-ink/5">
				<Image
					src={page.photo.url}
					alt={page.photo.caption}
					fill
					sizes="(min-width: 768px) 45vw, 90vw"
					className="object-cover"
				/>
			</div>
			<figcaption className="shrink-0 text-center">
				{page.photo.caption && <p className="text-sm text-ink/80">{page.photo.caption}</p>}
				{page.photo.uploaderName && (
					<p className="text-xs text-ink/50">
						{t(copy.photoBy, { name: page.photo.uploaderName })}
					</p>
				)}
			</figcaption>
		</figure>
	);
}
