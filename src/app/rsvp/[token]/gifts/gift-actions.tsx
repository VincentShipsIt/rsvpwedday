"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type GiftActionResult, releaseGift, reserveGift } from "@/app/rsvp/[token]/gifts/actions";
import type { GiftsCopy } from "@/components/site/gifts";
import { type GiftStatus, MAX_GIFT_MESSAGE_LENGTH } from "@/domain/gifts";
import { t } from "@/i18n";

const NAME_STORAGE_PREFIX = "wed:gift-reserver:";

export type GiftActionsProps = {
	token: string;
	/** Only what the control needs; the claim itself never crosses to the browser. */
	gift: { id: string; title: string };
	status: GiftStatus;
	/** Everyone on this invitation, so a gift is signed by a person, not a household. */
	guestNames: string[];
	copy: GiftsCopy;
};

/*
 * The one thing the public list cannot do: take a gift off it. This is the only client component
 * on the page — the cards themselves stay server-rendered, so the rich-text sanitiser never ends
 * up in a guest's bundle — and it holds the state for its own card alone.
 *
 * Reserving opens a small form instead of firing on the click, so a guest names themselves, can
 * add a word for the couple, and a mis-tap never silently claims something.
 */
export function GiftActions({ token, gift, status, guestNames, copy }: GiftActionsProps) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [guestName, setGuestName] = useState(guestNames[0] ?? "");
	const [message, setMessage] = useState("");
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Several people share one household link, so remember which of them is holding the phone.
	useEffect(() => {
		const stored = window.localStorage.getItem(`${NAME_STORAGE_PREFIX}${token}`);
		if (stored && guestNames.includes(stored)) {
			setGuestName(stored);
		}
	}, [token, guestNames]);

	function chooseName(name: string) {
		setGuestName(name);
		window.localStorage.setItem(`${NAME_STORAGE_PREFIX}${token}`, name);
	}

	function handleResult(result: GiftActionResult) {
		setIsPending(false);
		// Either way the server now knows more than this page does, so refresh: on success to show
		// the new state, and on a lost race to show the guest why their click bounced.
		router.refresh();
		if (result.ok) {
			setIsOpen(false);
			setMessage("");
			setError(null);
			return;
		}
		setError(result.reason === "already-taken" ? copy.takenRaceError : copy.genericError);
	}

	async function handleReserve() {
		setIsPending(true);
		setError(null);
		handleResult(
			await reserveGift(token, {
				giftId: gift.id,
				guestName: guestName || guestNames[0] || "",
				message: message.trim(),
			})
		);
	}

	async function handleRelease() {
		setIsPending(true);
		setError(null);
		handleResult(await releaseGift(token, gift.id));
	}

	if (status === "taken") {
		return null;
	}

	if (status === "mine") {
		return (
			<div className="flex flex-col items-end gap-1">
				<button
					type="button"
					disabled={isPending}
					onClick={handleRelease}
					className="rounded-full px-3 py-1.5 text-sm ring-1 ring-ink/20 transition-opacity disabled:opacity-50"
				>
					{copy.releaseButton}
				</button>
				{error && (
					<p aria-live="polite" className="text-xs text-rose">
						{error}
					</p>
				)}
			</div>
		);
	}

	if (!isOpen) {
		return (
			<div className="flex flex-col items-end gap-1">
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="rounded-full bg-green px-4 py-1.5 text-sm text-ivory transition-opacity hover:opacity-90"
				>
					{copy.reserveButton}
				</button>
				{error && (
					<p aria-live="polite" className="text-xs text-rose">
						{error}
					</p>
				)}
			</div>
		);
	}

	return (
		<form
			className="flex w-full flex-col gap-2 border-t border-ink/10 pt-3"
			onSubmit={(event) => {
				event.preventDefault();
				handleReserve();
			}}
		>
			<p className="text-sm font-medium">{t(copy.reserveHeading, { gift: gift.title })}</p>

			{guestNames.length > 1 && (
				<label className="flex flex-col gap-1 text-sm">
					<span className="text-ink/70">{copy.reserverLabel}</span>
					<select
						value={guestName}
						onChange={(event) => chooseName(event.target.value)}
						className="rounded-lg border border-ink/15 bg-ivory px-3 py-2 text-base"
					>
						{guestNames.map((name) => (
							<option key={name} value={name}>
								{name}
							</option>
						))}
					</select>
				</label>
			)}

			<label className="flex flex-col gap-1 text-sm">
				<span className="text-ink/70">{copy.messageLabel}</span>
				<input
					type="text"
					value={message}
					maxLength={MAX_GIFT_MESSAGE_LENGTH}
					placeholder={copy.messagePlaceholder}
					onChange={(event) => setMessage(event.target.value)}
					className="rounded-lg border border-ink/15 bg-ivory px-3 py-2 text-base"
				/>
			</label>

			<div className="flex flex-wrap gap-2">
				<button
					type="submit"
					disabled={isPending}
					className="rounded-full bg-green px-4 py-1.5 text-sm text-ivory transition-opacity disabled:opacity-50"
				>
					{isPending ? copy.reservingLabel : copy.confirmButton}
				</button>
				<button
					type="button"
					disabled={isPending}
					onClick={() => setIsOpen(false)}
					className="rounded-full px-4 py-1.5 text-sm ring-1 ring-ink/20 transition-opacity disabled:opacity-50"
				>
					{copy.cancelButton}
				</button>
			</div>

			{error && (
				<p aria-live="polite" className="text-sm text-rose">
					{error}
				</p>
			)}
		</form>
	);
}
