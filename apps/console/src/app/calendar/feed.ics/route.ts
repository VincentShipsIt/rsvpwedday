import { getCrm } from "@/lib/store";

function icsDate(iso: string): string {
	return iso.replaceAll("-", "");
}

export async function GET(): Promise<Response> {
	const { couples } = await getCrm();
	const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Say Yes//Studio CRM//EN"];
	for (const row of couples) {
		if (!row.date) continue;
		lines.push(
			"BEGIN:VEVENT",
			`UID:${row.id}@sayyess.com`,
			`DTSTART;VALUE=DATE:${icsDate(row.date)}`,
			`SUMMARY:${row.couple} — ${row.place.label}`,
			`LOCATION:${row.place.address ?? row.place.label}`,
			"END:VEVENT"
		);
	}
	lines.push("END:VCALENDAR");
	return new Response(`${lines.join("\r\n")}\r\n`, {
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Content-Disposition": "attachment; filename=say-yes.ics",
		},
	});
}
