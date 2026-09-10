import { type Contact, telHref, whatsappHref } from "@/lib/crm";

export function ContactLinks({ contact }: { contact: Contact }) {
	const parts: Array<{ href: string; label: string }> = [];
	if (contact.phone) parts.push({ href: telHref(contact.phone), label: contact.phone });
	if (contact.whatsapp) {
		parts.push({ href: whatsappHref(contact.whatsapp), label: "WhatsApp" });
	}
	if (contact.email) parts.push({ href: `mailto:${contact.email}`, label: contact.email });
	if (parts.length === 0) return <span className="text-ink-soft">—</span>;
	return (
		<ul className="flex flex-wrap gap-x-3 gap-y-1">
			{parts.map((part) => (
				<li key={part.href}>
					<a
						href={part.href}
						className="text-saffron underline-offset-2 hover:underline"
						target={part.href.startsWith("http") ? "_blank" : undefined}
						rel={part.href.startsWith("http") ? "noreferrer" : undefined}
					>
						{part.label}
					</a>
				</li>
			))}
		</ul>
	);
}
