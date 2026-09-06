import { serializeExportCsv } from "@/domain/csv";
import { getInvitationStatus } from "@/domain/invitation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
	const [invitations, events] = await Promise.all([
		db.invitation.findMany({
			include: { guests: { include: { attendance: true } } },
			orderBy: { createdAt: "asc" },
		}),
		db.event.findMany({ orderBy: { sortOrder: "asc" } }),
	]);

	const eventSlugs = events.map((event) => event.slug);
	const eventSlugById = new Map(events.map((event) => [event.id, event.slug]));

	const rows = invitations.flatMap((invitation) => {
		const status = getInvitationStatus(invitation);
		return invitation.guests.map((guest) => ({
			invitationEmail: invitation.email,
			status,
			firstName: guest.firstName,
			lastName: guest.lastName,
			kind: guest.kind,
			dietary: guest.dietary,
			attendanceByEventSlug: Object.fromEntries(
				guest.attendance.flatMap((attendance) => {
					const slug = eventSlugById.get(attendance.eventId);
					return slug ? [[slug, attendance.status]] : [];
				})
			),
		}));
	});

	const csv = serializeExportCsv(rows, eventSlugs);

	return new Response(csv, {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": 'attachment; filename="guests.csv"',
		},
	});
}
