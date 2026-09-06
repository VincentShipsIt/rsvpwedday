import "dotenv/config";
import { newToken } from "@/domain/token";
import { GuestKind, Locale } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

async function main() {
	const rsvpDeadline = new Date();
	rsvpDeadline.setDate(rsvpDeadline.getDate() + 60);

	const weddingDate = new Date();
	weddingDate.setDate(weddingDate.getDate() + 90);

	await db.settings.upsert({
		where: { id: 1 },
		create: { id: 1, coupleNames: "Jane & Alex", rsvpDeadline, replyTo: null },
		update: {},
	});

	const event = await db.event.upsert({
		where: { slug: "wedding" },
		create: {
			slug: "wedding",
			startsAt: weddingDate,
			venue: "Placeholder Venue",
			address: "123 Placeholder Street",
			sortOrder: 0,
			translations: {
				create: [
					{ locale: Locale.en, name: "Wedding Ceremony", description: "Join us as we say I do." },
					{
						locale: Locale.de,
						name: "Hochzeitszeremonie",
						description: "Sei dabei, wenn wir Ja sagen.",
					},
					{
						locale: Locale.ku,
						name: "Merasîma Zewacê",
						description: "Werin em bi hev re erê bibêjin.",
					},
				],
			},
		},
		update: {},
	});

	const existingInvitation = await db.invitation.findUnique({
		where: { email: "sample.guest@example.com" },
	});

	const invitation =
		existingInvitation ??
		(await db.invitation.create({
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
							attendance: { create: [{ eventId: event.id }] },
						},
						{
							firstName: "Robin",
							lastName: "Guest",
							kind: GuestKind.ADULT,
							attendance: { create: [{ eventId: event.id }] },
						},
					],
				},
			},
		}));

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
