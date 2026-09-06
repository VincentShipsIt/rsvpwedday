import "dotenv/config";
import { newToken } from "@/domain/token";
import { GuestKind, Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { seedContent } from "./content-seed";

// Development seed: the shared placeholder content plus one sample invitation to click through.
// Deployments run `seedContent` on its own (see `scripts/prepare-database.ts`) so a real guest
// list never gets a fake guest.
async function main() {
	const events = await seedContent();

	const existingInvitation = await db.invitation.findUnique({
		where: { email: "sample.guest@example.com" },
		include: { guests: true },
	});

	let invitation: { token: string };

	if (existingInvitation) {
		invitation = existingInvitation;
		// Backfills attendance for any event seeded after this invitation already existed (e.g. an
		// environment upgraded from the single-event seed), rather than only covering events that
		// existed the first time this invitation was created.
		for (const guest of existingInvitation.guests) {
			for (const seededEvent of events) {
				await db.eventAttendance.upsert({
					where: { guestId_eventId: { guestId: guest.id, eventId: seededEvent.id } },
					create: { guestId: guest.id, eventId: seededEvent.id },
					update: {},
				});
			}
		}
	} else {
		invitation = await db.invitation.create({
			data: {
				email: "sample.guest@example.com",
				token: newToken(),
				locale: Locale.en,
				companionAllowance: 1,
				guests: {
					create: [
						{
							firstName: "Sam",
							lastName: "Guest",
							kind: GuestKind.ADULT,
							attendance: { create: events.map((seededEvent) => ({ eventId: seededEvent.id })) },
						},
						{
							firstName: "Robin",
							lastName: "Guest",
							kind: GuestKind.ADULT,
							attendance: { create: events.map((seededEvent) => ({ eventId: seededEvent.id })) },
						},
					],
				},
			},
		});
	}

	console.info(`RSVP link: ${env.APP_URL}/rsvp/${invitation.token}`);
}

main()
	.catch((error: unknown) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await db.$disconnect();
	});
