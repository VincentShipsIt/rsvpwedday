import { childAttendanceCounts } from "@/domain/children";
import { notDeleted } from "@/domain/soft-delete";
import type { Prisma } from "@/generated/prisma/client";

export async function syncHouseholdAttendance(
	tx: Prisma.TransactionClient,
	invitationId: string,
	eventIds: string[],
	childrenCount?: number
) {
	const household = await tx.invitation.findUniqueOrThrow({
		where: { id: invitationId },
		include: {
			guests: { where: notDeleted, include: { attendance: true } },
			childAttendance: true,
		},
	});
	const previousChildren = childAttendanceCounts(household);
	for (const guest of household.guests) {
		await tx.eventAttendance.deleteMany({
			where: { guestId: guest.id, eventId: { notIn: eventIds } },
		});
		for (const eventId of eventIds)
			await tx.eventAttendance.upsert({
				where: { guestId_eventId: { guestId: guest.id, eventId } },
				create: { guestId: guest.id, eventId },
				update: {},
			});
	}
	await tx.invitationChildAttendance.deleteMany({
		where: { invitationId, eventId: { notIn: eventIds } },
	});
	const count = childrenCount ?? household.childrenUnder12;
	if (count != null) {
		for (const eventId of eventIds) {
			const attending = Math.min(count, previousChildren[eventId] ?? 0);
			await tx.invitationChildAttendance.upsert({
				where: { invitationId_eventId: { invitationId, eventId } },
				create: { invitationId, eventId, count: attending },
				update: { count: attending },
			});
		}
	}
}
