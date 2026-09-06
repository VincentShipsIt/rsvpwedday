import { Locale } from "@/generated/prisma/enums";
import { isLocale } from "@/i18n/locales";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatIcsDate(date: Date): string {
	return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

function escapeIcsText(value: string): string {
	return value
		.replace(/\\/g, "\\\\")
		.replace(/,/g, "\\,")
		.replace(/;/g, "\\;")
		.replace(/\n/g, "\\n");
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const url = new URL(request.url);
	const localeParam = url.searchParams.get("locale");
	const locale: Locale = localeParam && isLocale(localeParam) ? localeParam : Locale.en;

	const event = await db.event.findUnique({
		where: { slug },
		include: { translations: true },
	});

	if (!event) {
		return new Response("Event not found", { status: 404 });
	}

	const translation =
		event.translations.find((candidate) => candidate.locale === locale) ?? event.translations[0];
	const summary = translation?.name ?? event.slug;
	const description = translation?.description ?? "";

	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//rsvpwedday//EN",
		"BEGIN:VEVENT",
		`UID:${event.id}@rsvpwedday`,
		`DTSTAMP:${formatIcsDate(new Date())}`,
		`DTSTART:${formatIcsDate(event.startsAt)}`,
	];

	if (event.endsAt) {
		lines.push(`DTEND:${formatIcsDate(event.endsAt)}`);
	}

	lines.push(`SUMMARY:${escapeIcsText(summary)}`);
	lines.push(`LOCATION:${escapeIcsText(`${event.venue}, ${event.address}`)}`);

	if (description) {
		lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
	}
	if (event.mapsUrl) {
		lines.push(`URL:${event.mapsUrl}`);
	}

	lines.push("END:VEVENT", "END:VCALENDAR");

	return new Response(lines.join("\r\n"), {
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Content-Disposition": `attachment; filename="${event.slug}.ics"`,
		},
	});
}
