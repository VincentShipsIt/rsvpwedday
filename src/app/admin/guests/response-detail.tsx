"use client";

import type { InvitationRow } from "@/app/admin/guests/guests-list";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { EmailDeliveryStatus } from "@/domain/email-delivery";
import type { Attendance } from "@/generated/prisma/enums";

const ATTENDANCE_LABELS: Record<Attendance, string> = {
	ACCEPTED: "Attending",
	DECLINED: "Not attending",
	PENDING: "Awaiting reply",
};
const DELIVERY_LABELS: Record<EmailDeliveryStatus, string> = {
	accepted: "Accepted by email provider",
	failed: "Failed",
	simulated: "Simulated — not sent",
	attempted: "Attempted — outcome unconfirmed",
};

export function ResponseDetail({
	invitation,
	events,
	timeZone,
	onOpenChange,
}: {
	invitation: InvitationRow | null;
	events: { id: string; name: string }[];
	timeZone: string;
	onOpenChange: (open: boolean) => void;
}) {
	const invitedEvents = events.filter((event) => invitation?.eventIds.includes(event.id));
	return (
		<Dialog open={invitation !== null} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>Household response</DialogTitle>
					<DialogDescription>{invitation?.email}</DialogDescription>
				</DialogHeader>
				{invitation && (
					<div className="grid gap-6">
						<section className="grid gap-2">
							<p className="text-sm">
								{invitation.guests.length} adult(s), including{" "}
								{invitation.guests.filter((guest) => guest.addedByGuest).length} companion(s), and{" "}
								{invitation.childrenUnder12} children under 12.
							</p>
							<p className="text-sm text-muted-foreground">
								{invitation.respondedAt
									? `Last response: ${invitation.respondedAt} (${timeZone}).`
									: "This household has not submitted a response yet."}
							</p>
							<p className="text-xs text-muted-foreground">
								Invitation language: {invitation.locale.toUpperCase()} · Additional adult allowance:{" "}
								{invitation.companionAllowance}
							</p>
							<Input
								aria-label="Personal RSVP link"
								readOnly
								value={invitation.link}
								onFocus={(event) => event.target.select()}
							/>
						</section>

						<section className="grid gap-3">
							<h2 className="font-medium">Adults and companions</h2>
							{invitation.guests.length === 0 && (
								<p className="text-sm text-muted-foreground">No named adults on this invitation.</p>
							)}
							{invitation.guests.map((guest) => (
								<div key={guest.id} className="grid gap-3 rounded-lg border p-4">
									<div className="flex flex-wrap items-center gap-2">
										<h3 className="font-medium">
											{guest.firstName} {guest.lastName}
										</h3>
										{guest.addedByGuest && <Badge variant="secondary">Guest-added companion</Badge>}
									</div>
									<dl className="grid gap-2 text-sm sm:grid-cols-2">
										<div>
											<dt className="text-xs text-muted-foreground">Email</dt>
											<dd className="break-words">{guest.email || "Not provided"}</dd>
										</div>
										<div>
											<dt className="text-xs text-muted-foreground">Phone</dt>
											<dd>{guest.phone || "Not provided"}</dd>
										</div>
										<div className="sm:col-span-2">
											<dt className="text-xs text-muted-foreground">Dietary needs</dt>
											<dd className="whitespace-pre-wrap break-words">
												{guest.dietary || "None specified"}
											</dd>
										</div>
									</dl>
									{invitedEvents.length === 0 ? (
										<p className="text-xs text-muted-foreground">No events assigned.</p>
									) : (
										<dl className="grid gap-1 border-t pt-3 text-sm">
											{invitedEvents.map((event) => {
												const attendance = guest.attendance.find((row) => row.eventId === event.id);
												return (
													<div key={event.id} className="flex justify-between gap-4">
														<dt>{event.name}</dt>
														<dd className="text-right text-muted-foreground">
															{attendance ? ATTENDANCE_LABELS[attendance.status] : "Not invited"}
														</dd>
													</div>
												);
											})}
										</dl>
									)}
								</div>
							))}
						</section>

						<section className="grid gap-2 rounded-lg border p-4">
							<h2 className="font-medium">Children under 12: {invitation.childrenUnder12}</h2>
							{invitation.childrenUnder12 > 0 && (
								<dl className="grid gap-1 text-sm">
									{invitedEvents.map((event) => (
										<div key={event.id} className="flex justify-between gap-4">
											<dt>{event.name}</dt>
											<dd className="text-right text-muted-foreground">
												{!invitation.respondedAt
													? "Awaiting reply"
													: invitation.childAttendance[event.id] === undefined
														? "No count recorded"
														: `${invitation.childAttendance[event.id]} attending`}
											</dd>
										</div>
									))}
								</dl>
							)}
							{invitation.childDietary.length > 0 && (
								<p className="whitespace-pre-wrap text-sm text-muted-foreground">
									Previously recorded child dietary needs: {invitation.childDietary.join("; ")}
								</p>
							)}
						</section>

						<dl className="grid gap-4">
							<div>
								<dt className="font-medium">Message from the household</dt>
								<dd className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
									{invitation.note || "No message provided."}
								</dd>
							</div>
							<div>
								<dt className="font-medium">Song request</dt>
								<dd className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
									{invitation.songRequest || "No song requested."}
								</dd>
							</div>
						</dl>

						<section className="grid gap-3">
							<h2 className="font-medium">Email delivery history</h2>
							<p className="text-xs text-muted-foreground">
								Provider acceptance confirms a send, not inbox delivery. Times use {timeZone}.
							</p>
							{invitation.emailHistory.length === 0 && (
								<p className="text-sm text-muted-foreground">No email attempts recorded.</p>
							)}
							{invitation.emailHistory.map((log) => (
								<div key={log.id} className="grid gap-1 rounded-lg border p-3 text-sm">
									<p className="font-medium">
										{log.kind} · {DELIVERY_LABELS[log.status]}
									</p>
									<p className="text-xs text-muted-foreground">{log.attemptedAt}</p>
									{log.error && log.status === "failed" && (
										<p className="whitespace-pre-wrap break-words text-destructive">{log.error}</p>
									)}
								</div>
							))}
						</section>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
