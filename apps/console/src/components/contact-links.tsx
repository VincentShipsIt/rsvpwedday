"use client";

import { CheckIcon, MailIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { type Contact, threadHref, whatsappHref } from "@/lib/crm";

const ITEM =
	"inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[13px] transition-colors hover:bg-accent";

/*
 * Three different verbs, so three different affordances. A number is copied
 * because it gets dialled somewhere else; an address opens our own inbox,
 * because email is a conversation we keep rather than hand to a mail client;
 * WhatsApp is the only one that genuinely belongs in another app, so it is the
 * only one that leaves.
 */
export function ContactLinks({ contact, name }: { contact: Contact; name?: string }) {
	const [copied, setCopied] = useState(false);

	if (!contact.phone && !contact.whatsapp && !contact.email) {
		return <span className="text-muted-foreground">—</span>;
	}

	function copyPhone(value: string) {
		void navigator.clipboard?.writeText(value).then(() => {
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1600);
		});
	}

	return (
		<ul className="flex flex-wrap items-center gap-x-1 gap-y-1">
			{contact.phone ? (
				<li>
					<button
						type="button"
						onClick={() => copyPhone(contact.phone as string)}
						className={ITEM}
						title="Copy the number"
					>
						{copied ? (
							<CheckIcon className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
						) : (
							<PhoneIcon className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
						)}
						<span className="tabular-nums">{contact.phone}</span>
						<span className="sr-only">{copied ? "Copied" : "Copy the number"}</span>
					</button>
				</li>
			) : null}

			{contact.whatsapp ? (
				<li>
					<a
						href={whatsappHref(contact.whatsapp)}
						target="_blank"
						rel="noreferrer"
						className={ITEM}
						title={`WhatsApp ${contact.whatsapp}`}
					>
						<MessageCircleIcon className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
						<span className="sr-only">WhatsApp {contact.whatsapp}</span>
					</a>
				</li>
			) : null}

			{contact.email ? (
				<li>
					<Link
						href={threadHref("email", contact.email, name)}
						className={ITEM}
						title="Write from the inbox"
					>
						<MailIcon className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
						<span className="truncate">{contact.email}</span>
					</Link>
				</li>
			) : null}
		</ul>
	);
}
