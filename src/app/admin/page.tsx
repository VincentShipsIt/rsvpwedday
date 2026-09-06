import { AdminDashboard, type InvitationRow } from "@/app/admin/admin-dashboard";
import { computeHeadcount } from "@/domain/headcount";
import { getInvitationStatus } from "@/domain/invitation";
import { EmailKind, Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["all", "pending", "accepted", "declined"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

function isStatusFilter(value: string): value is StatusFilter {
	return (STATUS_FILTERS as readonly string[]).includes(value);
}

export default async function AdminDashboardPage({
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

	const headcount = computeHeadcount(invitations, events);
	const unsentCount = invitations.filter(
		(invitation) => !invitation.emails.some((log) => log.kind === EmailKind.INVITE)
	).length;
	const pendingCount = invitations.filter(
		(invitation) => getInvitationStatus(invitation) === "pending"
	).length;

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
	}));

	const eventRows = events.map((event) => {
		const translation =
			event.translations.find((candidate) => candidate.locale === Locale.en) ??
			event.translations[0];
		const counts = headcount.byEvent[event.id] ?? { adults: 0, children: 0 };
		return {
			id: event.id,
			name: translation?.name ?? event.slug,
			adults: counts.adults,
			children: counts.children,
		};
	});

	return (
		<AdminDashboard
			headcount={headcount}
			eventRows={eventRows}
			invitationRows={invitationRows}
			statusFilter={statusFilter}
			search={q ?? ""}
			unsentCount={unsentCount}
			pendingCount={pendingCount}
		/>
	);
}
