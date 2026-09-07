import { AdminDashboard } from "@/app/admin/admin-dashboard";
import { computeHeadcount } from "@/domain/headcount";
import { getInvitationStatus } from "@/domain/invitation";
import { EmailKind, Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
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
			unsentCount={unsentCount}
			pendingCount={pendingCount}
		/>
	);
}
