import { Locale, SiteTheme } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

/*
 * Placeholder wedding content: settings, the four events with their translations, the site copy,
 * and the story milestones. Every step is guarded on a count or an upsert, so this is safe to run
 * on every deploy — it fills an empty database once and never touches content afterwards. The
 * couple's real names, venue, and dates are typed into `/admin`, never committed here.
 */
export async function seedContent() {
	const rsvpDeadline = new Date();
	rsvpDeadline.setDate(rsvpDeadline.getDate() + 60);

	const weddingDate = new Date();
	weddingDate.setDate(weddingDate.getDate() + 90);

	await db.settings.upsert({
		where: { id: 1 },
		create: { id: 1, coupleNames: "Our Wedding", rsvpDeadline, replyTo: null },
		update: {},
	});

	// The full four-event lineup (welcome dinner, wedding, reception, farewell brunch) only gets
	// created once, from a clean database — an already-seeded environment that predates this
	// event keeps whatever single "wedding" event it has, via the upsert below, so re-running the
	// seed never duplicates or reorders existing events.
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
	} else {
		await db.event.upsert({
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

	await seedPlaceholderPhotos();

	return db.event.findMany({ orderBy: { sortOrder: "asc" } });
}

/*
 * Stand-in photography so a site with no pictures yet still reads as designed rather than as a
 * page of empty frames. These are couples and wedding details rather than scenery, because a
 * wedding page illustrated with landscapes reads as a template nobody finished.
 *
 * The source is Flickr's Creative Commons pool via loremflickr, addressed by tag and lock so a
 * given URL keeps returning the same photograph. Treat them as temporary: they are strangers'
 * photographs, and the point is to be replaced by the couple's own in `/admin/website`.
 */
const PLACEHOLDER_HERO = "https://loremflickr.com/1800/1200/wedding,couple?lock=14";

const PLACEHOLDER_GALLERY = [
	"https://loremflickr.com/900/1200/wedding,couple?lock=15",
	"https://loremflickr.com/1200/900/wedding,couple?lock=11",
	"https://loremflickr.com/900/900/wedding,ceremony?lock=31",
	"https://loremflickr.com/900/1200/wedding,ceremony?lock=32",
	"https://loremflickr.com/1200/900/wedding,ceremony?lock=33",
	"https://loremflickr.com/900/1100/wedding,couple?lock=16",
];

const PLACEHOLDER_MILESTONES = [
	"https://loremflickr.com/1000/800/wedding,couple?lock=13",
	"https://loremflickr.com/1000/800/wedding,couple?lock=16",
	"https://loremflickr.com/1000/800/wedding,couple?lock=12",
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
	return url.includes("loremflickr.com/") || url.includes("picsum.photos/seed/wed-");
}

async function seedPlaceholderPhotos() {
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
