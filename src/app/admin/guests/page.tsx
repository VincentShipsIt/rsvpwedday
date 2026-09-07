import {
	GuestsList,
	type InvitationRow,
	isStatusFilter,
	type StatusFilter,
} from "@/app/admin/guests/guests-list";
import { getInvitationStatus } from "@/domain/invitation";
import { invitedEventIds } from "@/domain/invitation-events";
import { Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function GuestsPage({
	searchParams,
}: {
	searchParams: Promise<{ status?: string; q?: string }>;
}) {
	const { status: statusParam, q } = await searchParams;
	const statusFilter: StatusFilter =
		statusParam && isStatusFilter(statusParam) ? statusParam : "all";

	const [invitations, events] = await Promise.all([
		db.invitation.findMany({
			include: { guests: { include: { attendance: true } }, emails: true },
			orderBy: { createdAt: "asc" },
		}),
		db.event.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
	]);

	const filteredInvitations = invitations.filter((invitation) => {
		const status = getInvitationStatus(invitation);
		if (statusFilter !== "all" && status !== statusFilter) {
			return false;
		}
		if (q) {
			const query = q.toLowerCase();
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

	const invitationRows: InvitationRow[] = filteredInvitations.map((invitation) => ({
		id: invitation.id,
		email: invitation.email,
		link: `${env.APP_URL}/rsvp/${invitation.token}`,
		locale: invitation.locale,
		companionAllowance: invitation.companionAllowance,
		status: getInvitationStatus(invitation),
		emailKinds: Array.from(new Set(invitation.emails.map((log) => log.kind))),
		guests: invitation.guests
			.filter((guest) => !guest.addedByGuest)
			.map((guest) => ({
				id: guest.id,
				firstName: guest.firstName,
				lastName: guest.lastName,
				kind: guest.kind,
				email: guest.email,
				phone: guest.phone,
			})),
		eventIds: invitedEventIds(invitation.guests),
	}));

	const eventRows = events.map((event) => {
		const translation =
			event.translations.find((candidate) => candidate.locale === Locale.en) ??
			event.translations[0];
		return { id: event.id, name: translation?.name ?? event.slug };
	});

	return (
		<GuestsList
			invitationRows={invitationRows}
			eventRows={eventRows}
			eventSlugs={events.map((event) => event.slug)}
			statusFilter={statusFilter}
			search={q ?? ""}
		/>
	);
}
