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

	await db.siteContent.upsert({
		where: { id: 1 },
		create: {
			id: 1,
			translations: {
				create: [
					{
						locale: Locale.en,
						tagline: "We're getting married and can't wait to celebrate with you.",
						storyIntro: "A few moments from our story so far.",
						rsvpNote: "You'll receive an RSVP link by email addressed to you.",
					},
					{
						locale: Locale.de,
						tagline: "Wir heiraten und können es kaum erwarten, mit euch zu feiern.",
						storyIntro: "Ein paar Momente aus unserer bisherigen Geschichte.",
						rsvpNote: "Du erhältst einen persönlichen Anmeldelink per E-Mail.",
					},
					{
						locale: Locale.ku,
						tagline: "Em dizewicin û em bêsebir in ku bi we re pîroz bikin.",
						storyIntro: "Çend gavên ji çîroka me ya heta niha.",
						rsvpNote: "Girêdaneke bersivdanê a taybet dê bi e-mailê ji te re bê şandin.",
					},
				],
			},
		},
		update: {},
	});

	const milestoneSeeds = [
		{
			sortOrder: 0,
			dateLabel: "Placeholder — how we met",
			en: { title: "How we met", body: "Placeholder copy for how the couple met." },
			de: {
				title: "Wie wir uns kennengelernt haben",
				body: "Platzhaltertext für das Kennenlernen.",
			},
			ku: { title: "Me çawa hevdu nas kir", body: "Nivîsa cîgir a ji bo nasîna cot." },
		},
		{
			sortOrder: 1,
			dateLabel: "Placeholder — the proposal",
			en: { title: "The proposal", body: "Placeholder copy for the proposal story." },
			de: { title: "Der Antrag", body: "Platzhaltertext für die Verlobungsgeschichte." },
			ku: { title: "Daxwaza zewacê", body: "Nivîsa cîgir a ji bo çîroka daxwaza zewacê." },
		},
		{
			sortOrder: 2,
			dateLabel: "Placeholder — today",
			en: { title: "Today", body: "Placeholder copy for where the couple is today." },
			de: { title: "Heute", body: "Platzhaltertext dafür, wo das Paar heute steht." },
			ku: { title: "Îro", body: "Nivîsa cîgir a ji bo rewşa cot a îro." },
		},
	];

	for (const seed of milestoneSeeds) {
		const existingMilestone = await db.storyMilestone.findFirst({
			where: { dateLabel: seed.dateLabel },
		});
		if (existingMilestone) {
			continue;
		}

		await db.storyMilestone.create({
			data: {
				sortOrder: seed.sortOrder,
				dateLabel: seed.dateLabel,
				translations: {
					create: [
						{ locale: Locale.en, title: seed.en.title, body: seed.en.body },
						{ locale: Locale.de, title: seed.de.title, body: seed.de.body },
						{ locale: Locale.ku, title: seed.ku.title, body: seed.ku.body },
					],
				},
			},
		});
	}

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
