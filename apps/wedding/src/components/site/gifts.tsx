import Image from "next/image";
import type { ReactNode } from "react";
import { Card } from "@/components/card";
import { Reveal } from "@/components/site/reveal";
import { RichText } from "@/components/site/rich-text";
import { type GiftStatus, type GiftView, giftStatus, summarizeGifts } from "@/domain/gifts";
import type { Dictionary } from "@/i18n";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

export type GiftsCopy = Dictionary["gifts"];

function staggerDelay(index: number): number {
	return Math.min(index * 80, 400);
}

/*
 * One gift card. The same markup serves the public page and the guest's own list — only
 * `action` differs, which is the whole difference between reading the list and reserving from
 * it. A taken card stays fully legible rather than being greyed into unreadability: a guest
 * still wants to see what the couple asked for.
 */
export function GiftCard({
	gift,
	status,
	copy,
	action,
}: {
	gift: GiftView;
	status: GiftStatus;
	copy: GiftsCopy;
	/** The reserve/release control, on the guest's own list; nothing on the public page. */
	action?: ReactNode;
}) {
	const statusLabel: Record<GiftStatus, string> = {
		available: copy.availableLabel,
		mine: copy.mineLabel,
		taken: copy.takenLabel,
	};

	return (
		<Card className="flex h-full flex-col gap-3">
			{gift.imageUrl && (
				<div className="relative -mx-6 -mt-6 mb-1 aspect-[4/3] overflow-hidden rounded-t-xl">
					<Image
						src={gift.imageUrl}
						alt=""
						fill
						sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
						className={cn("object-cover", status === "taken" && "opacity-60 saturate-50")}
					/>
				</div>
			)}

			<div className="flex flex-wrap items-start justify-between gap-2">
				<h3 className="text-xl">{gift.title}</h3>
				{gift.price && <span className="shrink-0 pt-1 text-sm text-ink/60">{gift.price}</span>}
			</div>

			<RichText html={gift.body} className="text-sm text-ink/70" />

			{gift.url && (
				<a
					href={gift.url}
					target="_blank"
					rel="noreferrer"
					className="link-underline text-sm text-green"
				>
					{copy.viewLink}
				</a>
			)}

			<div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
				<span
					className={cn(
						"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
						status === "available" && "bg-green/10 text-green",
						status === "mine" && "bg-green/15 text-green",
						status === "taken" && "bg-ink/5 text-ink/50"
					)}
				>
					<span
						aria-hidden="true"
						className={cn(
							"h-1.5 w-1.5 rounded-full",
							status === "available" ? "bg-green" : "bg-current"
						)}
					/>
					{statusLabel[status]}
				</span>
				{action}
			</div>
		</Card>
	);
}

/*
 * The grid itself, with no opinion about where it sits. `viewerInvitationId` is null on the
 * public page, which is exactly why a claimed gift reads as "already taken" there and never as
 * somebody's name: who gave what is the couple's business, not the whole guest list's.
 */
export function GiftGrid({
	gifts,
	copy,
	viewerInvitationId,
	renderAction,
}: {
	gifts: GiftView[];
	copy: GiftsCopy;
	viewerInvitationId: string | null;
	renderAction?: (gift: GiftView, status: GiftStatus) => ReactNode;
}) {
	// `w-full` is load-bearing: the guest's own page centres its children, and without it the grid
	// shrinks to its content and stacks every card in one narrow column.
	return (
		<div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{gifts.map((gift, index) => {
				const status = giftStatus(gift, viewerInvitationId);
				return (
					<Reveal key={gift.id} delay={staggerDelay(index)}>
						<GiftCard
							gift={gift}
							status={status}
							copy={copy}
							action={renderAction?.(gift, status)}
						/>
					</Reveal>
				);
			})}
		</div>
	);
}

/** How much of the list is still open, as a line a guest can read at a glance. */
export function giftCountLine(gifts: GiftView[], copy: GiftsCopy): string {
	const { total, available } = summarizeGifts(gifts);
	if (available === 0) {
		return copy.allTakenLabel;
	}
	return t(copy.countLabel, { available, total });
}

/*
 * The GIFTS block on a public page: the couple's heading and intro over the list. Reserving is
 * not possible here — it needs an invitation — so the section says where to do it instead of
 * showing controls that would not work.
 */
export function Gifts({
	anchor,
	heading,
	intro,
	gifts,
	copy,
}: {
	anchor: string;
	heading: string;
	intro: string;
	gifts: GiftView[];
	copy: GiftsCopy;
}) {
	if (gifts.length === 0) {
		return null;
	}

	return (
		<section
			id={anchor || undefined}
			className="mx-auto flex max-w-6xl scroll-mt-[var(--wed-nav-height)] flex-col gap-8 px-6 py-16"
		>
			<Reveal className="flex flex-col gap-3">
				{heading && <h2 className="text-3xl font-medium sm:text-4xl">{heading}</h2>}
				<RichText html={intro} className="max-w-3xl text-ink/70" />
				<p className="text-sm text-ink/60">{giftCountLine(gifts, copy)}</p>
			</Reveal>

			<GiftGrid gifts={gifts} copy={copy} viewerInvitationId={null} />

			<Reveal className="text-sm text-ink/60">
				<p>{copy.publicHint}</p>
			</Reveal>
		</section>
	);
}
