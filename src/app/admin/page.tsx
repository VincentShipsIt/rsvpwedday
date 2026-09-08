import { AdminDashboard } from "@/app/admin/admin-dashboard";
import { hasSuccessfulEmail } from "@/domain/email-delivery";
import { computeHeadcount } from "@/domain/headcount";
import { getInvitationStatus } from "@/domain/invitation";
import { EmailKind, Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
	searchParams,
}: {
	searchParams: Promise<{ accepted?: string; failed?: string; simulated?: string }>;
}) {
	const result = await searchParams;
	const count = (value?: string) =>
		/^\d+$/.test(value ?? "") ? Math.min(Number(value), 1_000_000) : 0;
	const deliverySummary =
		result.accepted !== undefined
			? `${count(result.accepted)} accepted by the email provider, ${count(result.failed)} failed, ${count(result.simulated)} simulated. Failed and simulated invites remain eligible for retry; see All guests for details.`
			: undefined;
	const [invitations, events] = await Promise.all([
		db.invitation.findMany({
			include: { childAttendance: true, guests: { include: { attendance: true } }, emails: true },
			orderBy: { createdAt: "asc" },
		}),
		db.event.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
	]);

	const headcount = computeHeadcount(invitations, events);
	const unsentCount = invitations.filter(
		(invitation) => !hasSuccessfulEmail(invitation.emails, EmailKind.INVITE)
	).length;
	const pendingCount = invitations.filter(
		(invitation) => getInvitationStatus(invitation) === "pending"
	).length;
	const attendingCount = invitations.filter(
		(invitation) => getInvitationStatus(invitation) === "accepted"
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
			deliverySummary={deliverySummary}
			headcount={headcount}
			eventRows={eventRows}
			unsentCount={unsentCount}
			pendingCount={pendingCount}
			attendingCount={attendingCount}
		/>
	);
}
