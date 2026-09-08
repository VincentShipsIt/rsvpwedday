import { Attendance, GuestKind } from "@/generated/prisma/enums";

export type InvitationStatus = "pending" | "accepted" | "declined";

export type InvitationStatusInput = {
	respondedAt: Date | null;
	childrenUnder12?: number | null;
	childAttendance?: { count: number }[];
	guests: { kind?: GuestKind; attendance: { status: Attendance }[] }[];
};

export function getInvitationStatus(invitation: InvitationStatusInput): InvitationStatus {
	if (invitation.respondedAt === null) {
		return "pending";
	}

	const hasAccepted = invitation.guests.some(
		(guest) =>
			(invitation.childrenUnder12 == null || guest.kind !== GuestKind.CHILD) &&
			guest.attendance.some((attendance) => attendance.status === Attendance.ACCEPTED)
	);

	const childrenAccepted =
		invitation.childrenUnder12 != null && invitation.childAttendance?.some((row) => row.count > 0);
	return hasAccepted || childrenAccepted ? "accepted" : "declined";
}

export function canRespond(now: Date, deadline: Date): boolean {
	return now.getTime() <= deadline.getTime();
}
