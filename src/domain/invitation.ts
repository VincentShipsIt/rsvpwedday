import { Attendance } from "@/generated/prisma/client";

export type InvitationStatus = "pending" | "accepted" | "declined";

export type InvitationStatusInput = {
	respondedAt: Date | null;
	guests: { attendance: { status: Attendance }[] }[];
};

export function getInvitationStatus(invitation: InvitationStatusInput): InvitationStatus {
	if (invitation.respondedAt === null) {
		return "pending";
	}

	const hasAccepted = invitation.guests.some((guest) =>
		guest.attendance.some((attendance) => attendance.status === Attendance.ACCEPTED)
	);

	return hasAccepted ? "accepted" : "declined";
}

export function canRespond(now: Date, deadline: Date): boolean {
	return now.getTime() <= deadline.getTime();
}
