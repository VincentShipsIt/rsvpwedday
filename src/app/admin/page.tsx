import Link from "next/link";
import {
	remindAllPending,
	sendInvitesToUnsent,
	sendInviteToOne,
	sendReminderToOne,
} from "@/app/admin/actions";
import { CopyLinkButton } from "@/app/admin/copy-link-button";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { fieldClassName, Input } from "@/components/input";
import { StatusBadge } from "@/components/status-badge";
import { computeHeadcount } from "@/domain/headcount";
import { getInvitationStatus } from "@/domain/invitation";
import { EmailKind, Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["all", "pending", "accepted", "declined"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function isStatusFilter(value: string): value is StatusFilter {
	return (STATUS_FILTERS as readonly string[]).includes(value);
}

export default async function AdminDashboardPage({
	searchParams,
}: {
	searchParams: Promise<{ status?: string; q?: string; confirm?: string }>;
}) {
	const { status: statusParam, q, confirm } = await searchParams;
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
	const unsentInvitations = invitations.filter(
		(invitation) => !invitation.emails.some((log) => log.kind === EmailKind.INVITE)
	);
	const pendingInvitations = invitations.filter(
		(invitation) => getInvitationStatus(invitation) === "pending"
	);

	if (confirm === "send-invites") {
		return (
			<Card className="flex flex-col gap-4">
				<p>Send invite emails to {unsentInvitations.length} invitation(s) not yet invited?</p>
				<div className="flex gap-3">
					<form action={sendInvitesToUnsent}>
						<Button type="submit">Yes, send invites</Button>
					</form>
					<Link href="/admin" className="text-sm text-green underline underline-offset-4">
						Cancel
					</Link>
				</div>
			</Card>
		);
	}

	if (confirm === "remind-pending") {
		return (
			<Card className="flex flex-col gap-4">
				<p>Send a reminder to {pendingInvitations.length} pending invitation(s)?</p>
				<div className="flex gap-3">
					<form action={remindAllPending}>
						<Button type="submit">Yes, send reminders</Button>
					</form>
					<Link href="/admin" className="text-sm text-green underline underline-offset-4">
						Cancel
					</Link>
				</div>
			</Card>
		);
	}

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

	return (
		<div className="flex flex-col gap-8">
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<Card>
					<p className="text-xs text-ink/60">Pending</p>
					<p className="text-2xl">{headcount.invitations.pending}</p>
				</Card>
				<Card>
					<p className="text-xs text-ink/60">Accepted</p>
					<p className="text-2xl">{headcount.invitations.accepted}</p>
				</Card>
				<Card>
					<p className="text-xs text-ink/60">Declined</p>
					<p className="text-2xl">{headcount.invitations.declined}</p>
				</Card>
				<Card>
					<p className="text-xs text-ink/60">Attending (adults / children)</p>
					<p className="text-2xl">
						{headcount.attendingOverall.adults} / {headcount.attendingOverall.children}
					</p>
				</Card>
			</div>

			<Card>
				<table className="w-full text-left text-sm">
					<thead>
						<tr>
							<th className="pb-2">Event</th>
							<th className="pb-2">Adults</th>
							<th className="pb-2">Children</th>
						</tr>
					</thead>
					<tbody>
						{events.map((event) => {
							const translation =
								event.translations.find((candidate) => candidate.locale === Locale.en) ??
								event.translations[0];
							const counts = headcount.byEvent[event.id] ?? { adults: 0, children: 0 };
							return (
								<tr key={event.id} className="border-t border-ink/10">
									<td className="py-2">{translation?.name ?? event.slug}</td>
									<td className="py-2">{counts.adults}</td>
									<td className="py-2">{counts.children}</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</Card>

			<div className="flex flex-wrap gap-4">
				<Link
					href="/admin?confirm=send-invites"
					className="text-sm text-green underline underline-offset-4"
				>
					Send invites to everyone not yet invited ({unsentInvitations.length})
				</Link>
				<Link
					href="/admin?confirm=remind-pending"
					className="text-sm text-green underline underline-offset-4"
				>
					Remind everyone pending ({pendingInvitations.length})
				</Link>
			</div>

			<form method="get" className="flex flex-wrap items-center gap-3">
				<select name="status" defaultValue={statusFilter} className={fieldClassName}>
					{STATUS_FILTERS.map((filter) => (
						<option key={filter} value={filter}>
							{filter}
						</option>
					))}
				</select>
				<Input name="q" defaultValue={q ?? ""} placeholder="Search email or guest name" />
				<Button type="submit" variant="secondary">
					Filter
				</Button>
			</form>

			<Card className="overflow-x-auto">
				<table className="w-full text-left text-sm">
					<thead>
						<tr>
							<th className="pb-2">Email</th>
							<th className="pb-2">Status</th>
							<th className="pb-2">Guests</th>
							<th className="pb-2">Actions</th>
						</tr>
					</thead>
					<tbody>
						{filteredInvitations.map((invitation) => {
							const status = getInvitationStatus(invitation);
							const link = `${env.APP_URL}/rsvp/${invitation.token}`;
							return (
								<tr key={invitation.id} className="border-t border-ink/10 align-top">
									<td className="py-2">{invitation.email}</td>
									<td className="py-2">
										<StatusBadge status={status} label={status} />
									</td>
									<td className="py-2">
										{invitation.guests
											.filter((guest) => !guest.addedByGuest)
											.map((guest) => `${guest.firstName} ${guest.lastName}`)
											.join(", ")}
									</td>
									<td className="flex flex-wrap gap-2 py-2">
										<CopyLinkButton link={link} />
										<form action={sendInviteToOne.bind(null, invitation.id)}>
											<Button type="submit" variant="ghost">
												Send invite
											</Button>
										</form>
										{status === "pending" && (
											<form action={sendReminderToOne.bind(null, invitation.id)}>
												<Button type="submit" variant="ghost">
													Send reminder
												</Button>
											</form>
										)}
										<Link
											href={`/admin/invitations/${invitation.id}`}
											className="text-sm text-green underline underline-offset-4"
										>
											Edit
										</Link>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</Card>
		</div>
	);
}
