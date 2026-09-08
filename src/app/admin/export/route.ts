import { childAttendanceCounts, childrenUnder12 } from "@/domain/children";
import { type ExportGuestRow, serializeExportCsv } from "@/domain/csv";
import { getInvitationStatus } from "@/domain/invitation";
import { notDeleted } from "@/domain/soft-delete";
import { GuestKind } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function GET() {
	await requireAdmin();
	const [invitations, events] = await Promise.all([
		db.invitation.findMany({
			include: {
				guests: { where: notDeleted, include: { attendance: true } },
				childAttendance: true,
			},
			orderBy: { createdAt: "asc" },
		}),
		db.event.findMany({ orderBy: { sortOrder: "asc" } }),
	]);
	const eventSlugs = events.map((event) => event.slug);
	const eventSlugById = new Map(events.map((event) => [event.id, event.slug]));
	const rows = invitations.flatMap((invitation): ExportGuestRow[] => {
		const shared = {
			invitationEmail: invitation.email,
			status: getInvitationStatus(invitation),
			note: invitation.note,
			songRequest: invitation.songRequest,
			respondedAt: invitation.respondedAt?.toISOString() ?? null,
		};
		const adults: ExportGuestRow[] = invitation.guests
			.filter((guest) => guest.kind === GuestKind.ADULT)
			.map((guest) => ({
				...shared,
				guestId: guest.id,
				firstName: guest.firstName,
				lastName: guest.lastName,
				kind: guest.kind,
				guestEmail: guest.email,
				guestPhone: guest.phone,
				addedByGuest: guest.addedByGuest,
				dietary: guest.dietary,
				attendanceByEventSlug: Object.fromEntries(
					guest.attendance.flatMap((row) => {
						const slug = eventSlugById.get(row.eventId);
						return slug ? [[slug, row.status]] : [];
					})
				),
			}));
		const count = childrenUnder12(invitation);
		if (count > 0)
			adults.push({
				...shared,
				firstName: "Children under 12",
				lastName: "",
				kind: GuestKind.CHILD,
				childrenUnder12: count,
				dietary:
					invitation.childrenDietary ??
					invitation.guests
						.filter((guest) => guest.kind === GuestKind.CHILD)
						.map((guest) => guest.dietary)
						.filter(Boolean)
						.join("; "),
				attendanceByEventSlug: Object.fromEntries(
					Object.entries(childAttendanceCounts(invitation)).flatMap(([eventId, attendance]) => {
						const slug = eventSlugById.get(eventId);
						return slug ? [[slug, String(attendance)]] : [];
					})
				),
			});
		return adults;
	});
	return new Response(serializeExportCsv(rows, eventSlugs), {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": 'attachment; filename="guests.csv"',
			"Cache-Control": "private, no-store",
		},
	});
}
