import type { Prisma } from "@/generated/prisma/client";
import { Locale, SiteTheme } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

// Initialization and its marker commit together. An interrupted first setup rolls back and is
// retried; pre-marker installations are adopted without restoring deliberately removed content.
export async function seedContent() {
	return db.$transaction(
		async (tx) => {
			await tx.$executeRaw`SELECT pg_advisory_xact_lock(700055)`;
			if (await tx.bootstrapState.findUnique({ where: { id: "content-v1" } })) {
				return tx.event.findMany({ orderBy: { sortOrder: "asc" } });
			}
			const existing = await Promise.all([
				tx.settings.count(),
				tx.siteContent.count(),
				tx.event.count(),
				tx.page.count(),
				tx.storyMilestone.count(),
				tx.invitation.count(),
			]);
			if (existing.every((count) => count === 0)) await initializeContent(tx);
			await tx.bootstrapState.create({ data: { id: "content-v1" } });
			return tx.event.findMany({ orderBy: { sortOrder: "asc" } });
		},
		{ timeout: 30_000 }
	);
}

async function initializeContent(db: Prisma.TransactionClient) {
	const rsvpDeadline = new Date();
	rsvpDeadline.setDate(rsvpDeadline.getDate() + 60);

	const weddingDate = new Date();
	weddingDate.setDate(weddingDate.getDate() + 90);

	await db.settings.upsert({
		where: { id: 1 },
		create: { id: 1, coupleNames: "Our Wedding", rsvpDeadline, replyTo: null },
		update: {},
	});

	// Only reached for a fresh database, within the initialization transaction.
	const eventCount = await db.event.count();

	if (eventCount === 0) {
		const welcomeDinnerDate = new Date(weddingDate);
		welcomeDinnerDate.setDate(welcomeDinnerDate.getDate() - 1);
		welcomeDinnerDate.setHours(18, 0, 0, 0);

		const receptionDate = new Date(weddingDate);
		receptionDate.setHours(receptionDate.getHours() + 7);

		const farewellBrunchDate = new Date(weddingDate);
		farewellBrunchDate.setDate(farewellBrunchDate.getDate() + 1);
		farewellBrunchDate.setHours(10, 0, 0, 0);

		await db.event.create({
			data: {
				slug: "welcome-dinner",
				startsAt: welcomeDinnerDate,
				venue: "Placeholder Venue",
				address: "123 Placeholder Street",
				dressCode: "Smart casual",
				sortOrder: 0,
				translations: {
					create: [
						{
							locale: Locale.en,
							name: "Welcome Dinner",
							description: "An easy start to the weekend — food, drinks, and good company.",
						},
						{
							locale: Locale.de,
							name: "Begrüßungsessen",
							description:
								"Ein entspannter Start ins Wochenende — Essen, Getränke und gute Gesellschaft.",
						},
						{
							locale: Locale.ku,
							name: "Şîva Bixêrhatinê",
							description: "Destpêkek hêsan a dawiya hefteyê — xwarin, vexwarin û hevaltiya baş.",
						},
					],
				},
			},
		});

		await db.event.create({
			data: {
				slug: "wedding",
				startsAt: weddingDate,
				venue: "Placeholder Venue",
				address: "123 Placeholder Street",
				sortOrder: 1,
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
		});

		await db.event.create({
			data: {
				slug: "reception",
				startsAt: receptionDate,
				venue: "Placeholder Venue",
				address: "123 Placeholder Street",
				dressCode: "Black tie optional",
				sortOrder: 2,
				translations: {
					create: [
						{
							locale: Locale.en,
							name: "Reception",
							description: "Dinner, dancing, and celebrating into the night.",
						},
						{
							locale: Locale.de,
							name: "Empfang",
							description: "Abendessen, Tanz und Feiern bis in die Nacht.",
						},
						{
							locale: Locale.ku,
							name: "Pêşwazî",
							description: "Şîv, reqisîn û pîrozkirin heta şevê.",
						},
					],
				},
			},
		});

		await db.event.create({
			data: {
				slug: "farewell-brunch",
				startsAt: farewellBrunchDate,
				venue: "Placeholder Venue",
				address: "123 Placeholder Street",
				sortOrder: 3,
				translations: {
					create: [
						{
							locale: Locale.en,
							name: "Farewell Brunch",
							description: "One last catch-up before everyone heads home.",
						},
						{
							locale: Locale.de,
							name: "Abschieds-Brunch",
							description: "Ein letztes Beisammensein, bevor alle nach Hause fahren.",
						},
						{
							locale: Locale.ku,
							name: "Taştêya Xatirxwestinê",
							description: "Civîna dawî berî ku her kes here mala xwe.",
						},
					],
				},
			},
		});
	}

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

	const milestoneCount = await db.storyMilestone.count();
	if (milestoneCount === 0) {
		for (const seed of milestoneSeeds) {
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
	}

	await seedPlaceholderPhotos(db);

	return db.event.findMany({ orderBy: { sortOrder: "asc" } });
}

/*
 * Stand-in photography so a site with no pictures yet still reads as designed rather than as a
 * page of empty frames. These are couples and wedding details rather than scenery, because a
 * wedding page illustrated with landscapes reads as a template nobody finished.
 *
 * The source is picsum.photos, addressed by seed so a given URL keeps returning the same
 * photograph (loremflickr, the previous source, started answering every request with a 500).
 * Treat them as temporary: they are strangers' photographs, and the point is to be replaced by
 * the couple's own in `/admin/website`.
 */
const PLACEHOLDER_HERO = "https://picsum.photos/seed/wedding-hero/1800/1200";

const PLACEHOLDER_GALLERY = [
	"https://picsum.photos/seed/wedding-15/900/1200",
	"https://picsum.photos/seed/wedding-11/1200/900",
	"https://picsum.photos/seed/wedding-31/900/900",
	"https://picsum.photos/seed/wedding-32/900/1200",
	"https://picsum.photos/seed/wedding-33/1200/900",
	"https://picsum.photos/seed/wedding-16/900/1100",
];

const PLACEHOLDER_MILESTONES = [
	"https://picsum.photos/seed/wedding-13/1000/800",
	"https://picsum.photos/seed/wedding-16/1000/800",
	"https://picsum.photos/seed/wedding-12/1000/800",
];

/*
 * Bump when the placeholder set above changes. A site still carrying an older generation, and
 * nothing but that generation, gets upgraded; a site already on this one is left alone, which is
 * what makes deleting every placeholder in the admin stick instead of reappearing on the next
 * deploy. Generation 1 was a set of scenery shots, replaced because a wedding page illustrated
 * with landscapes reads as an unfinished template. Generation 3 rides along a one-time nudge of
 * `SiteContent.theme` to GARDEN (see `seedPlaceholderPhotos` below) for any site still sitting on
 * the default EDITORIAL theme.
 */
const PLACEHOLDER_GENERATION = 3;

// Anything the deploy seed has ever written. A photo from outside this list is the couple's own.
function isSeededPlaceholder(url: string): boolean {
	return (
		url.includes("loremflickr.com/") ||
		url.includes("picsum.photos/seed/wed-") ||
		url.includes("picsum.photos/seed/wedding-")
	);
}

async function seedPlaceholderPhotos(db: Prisma.TransactionClient) {
	const siteContent = await db.siteContent.findUnique({ where: { id: 1 } });

	if (!siteContent || siteContent.placeholderPhotoGeneration >= PLACEHOLDER_GENERATION) {
		return;
	}

	// A one-time nudge to the couple's chosen theme, not an override: only touches a site still
	// sitting on the default EDITORIAL theme, tied to this same generation bump so it only ever
	// applies once, regardless of which branch below runs.
	const themeNudge = siteContent.theme === SiteTheme.EDITORIAL ? { theme: SiteTheme.GARDEN } : {};

	const milestones = await db.storyMilestone.findMany({ orderBy: { sortOrder: "asc" } });
	const currentPhotos = [
		siteContent.heroImageUrl,
		...siteContent.galleryUrls,
		...milestones.map((milestone) => milestone.imageUrl),
	].filter((url): url is string => Boolean(url));

	// Real photography present: record the generation so this never runs again, and change nothing
	// but the theme nudge above.
	if (currentPhotos.some((url) => !isSeededPlaceholder(url))) {
		await db.siteContent.update({
			where: { id: 1 },
			data: { placeholderPhotoGeneration: PLACEHOLDER_GENERATION, ...themeNudge },
		});
		return;
	}

	await db.siteContent.update({
		where: { id: 1 },
		data: {
			heroImageUrl: PLACEHOLDER_HERO,
			galleryUrls: PLACEHOLDER_GALLERY,
			placeholderPhotoGeneration: PLACEHOLDER_GENERATION,
			...themeNudge,
		},
	});

	for (const [index, milestone] of milestones.entries()) {
		await db.storyMilestone.update({
			where: { id: milestone.id },
			data: { imageUrl: PLACEHOLDER_MILESTONES[index % PLACEHOLDER_MILESTONES.length] },
		});
	}
}
