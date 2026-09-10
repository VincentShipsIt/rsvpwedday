import { getCrm } from "@/lib/store";

function icsDate(iso: string): string {
	return iso.replaceAll("-", "");
}

export async function GET(): Promise<Response> {
	const { clients, leads } = await getCrm();
	const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Say Yes//Studio CRM//EN"];
	for (const client of clients) {
		lines.push(
			"BEGIN:VEVENT",
			`UID:${client.id}@sayyess.com`,
			`DTSTART;VALUE=DATE:${icsDate(client.date)}`,
			`SUMMARY:${client.couple} — ${client.place.label}`,
			`LOCATION:${client.place.address ?? client.place.label}`,
			"END:VEVENT"
		);
	}
	for (const lead of leads) {
		if (!lead.date) continue;
		lines.push(
			"BEGIN:VEVENT",
			`UID:lead-${lead.id}@sayyess.com`,
			`DTSTART;VALUE=DATE:${icsDate(lead.date)}`,
			`SUMMARY:[Lead] ${lead.couple} — ${lead.place.label}`,
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
