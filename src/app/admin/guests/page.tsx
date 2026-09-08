import { GuestsList, type InvitationRow, type StatusFilter } from "@/app/admin/guests/guests-list";
import { childAttendanceCounts, childrenUnder12 } from "@/domain/children";
import { emailDeliveryStatus } from "@/domain/email-delivery";
import { getInvitationStatus } from "@/domain/invitation";
import { invitedEventIds } from "@/domain/invitation-events";
import { populatedTranslation } from "@/domain/translations";
import { Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export default async function GuestsPage({
	searchParams,
}: {
	searchParams: Promise<{
		status?: string;
		q?: string;
		mediaPending?: string;
		legacyPhotos?: string;
	}>;
}) {
	await requireAdmin();
	const { status: statusParam, q, mediaPending, legacyPhotos } = await searchParams;
	const statusFilter: StatusFilter =
		(["all", "pending", "accepted", "declined"] as const).find((value) => value === statusParam) ??
		"all";

	const [invitations, events, settings] = await Promise.all([
		db.invitation.findMany({
			include: {
				guests: { include: { attendance: true } },
				childAttendance: true,
				emails: { orderBy: { sentAt: "desc" } },
			},
			orderBy: { createdAt: "asc" },
		}),
		db.event.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
		db.settings.findUnique({ where: { id: 1 }, select: { timeZone: true } }),
	]);

	const filteredInvitations = invitations.filter((invitation) => {
		const status = getInvitationStatus(invitation);
		if (statusFilter !== "all" && status !== statusFilter) {
			return false;
		}
		if (q) {
			const query = q.trim().toLowerCase();
			const matchesEmail = invitation.email.toLowerCase().includes(query);
			const matchesGuest = invitation.guests.some((guest) =>
				`${guest.firstName} ${guest.lastName}`.toLowerCase().includes(query)
			);
			if (!matchesEmail && !matchesGuest) {
				return false;
			}
		}
		return true;
	});

	const timeZone = settings?.timeZone ?? "UTC";
	const invitationRows: InvitationRow[] = filteredInvitations.map((invitation) => ({
		id: invitation.id,
		email: invitation.email,
		link: `${env.APP_URL}/rsvp/${invitation.token}`,
		locale: invitation.locale,
		companionAllowance: invitation.companionAllowance,
		childrenUnder12: childrenUnder12(invitation),
		childAttendance: childAttendanceCounts(invitation),
		childDietary: invitation.guests.flatMap((guest) =>
			guest.kind === "CHILD" && guest.dietary ? [guest.dietary] : []
		),
		respondedAt: invitation.respondedAt
			? formatDateTime(invitation.respondedAt, "en", timeZone)
			: null,
		note: invitation.note,
		songRequest: invitation.songRequest,
		emailHistory: invitation.emails.map((log) => ({
			id: log.id,
			kind: log.kind,
			status: emailDeliveryStatus(log),
			error: log.error,
			attemptedAt: formatDateTime(log.sentAt, "en", timeZone),
		})),
		status: getInvitationStatus(invitation),
		emailKinds: Array.from(
			new Set(
				invitation.emails
					.filter((log) => emailDeliveryStatus(log) === "accepted")
					.map((log) => log.kind)
			)
		),
		guests: invitation.guests
			.filter((guest) => guest.kind === "ADULT")
			.map((guest) => ({
				id: guest.id,
				firstName: guest.firstName,
				lastName: guest.lastName,
				kind: guest.kind,
				email: guest.email,
				phone: guest.phone,
				dietary: guest.dietary,
				addedByGuest: guest.addedByGuest,
				attendance: guest.attendance.map((row) => ({ eventId: row.eventId, status: row.status })),
			})),
		eventIds: [
			...new Set([
				...invitedEventIds(invitation.guests),
				...invitation.childAttendance.map((row) => row.eventId),
			]),
		],
	}));

	const eventRows = events.map((event) => {
		const translation = populatedTranslation(event.translations, Locale.en, ["name"]);
		return { id: event.id, name: translation.name || event.slug };
	});

	return (
		<GuestsList
			invitationRows={invitationRows}
			eventRows={eventRows}
			eventSlugs={events.map((event) => event.slug)}
			statusFilter={statusFilter}
			search={q ?? ""}
			totalInvitations={invitations.length}
			timeZone={timeZone}
			mediaPending={Number(mediaPending) > 0}
			legacyPhotos={Number(legacyPhotos) > 0}
		/>
	);
}
