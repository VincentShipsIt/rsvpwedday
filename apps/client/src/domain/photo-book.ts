/*
 * The rules the photo book is gated by, and the paging that turns a flat list of photos into
 * the leaves of a book. Kept out of the page components so both the guest route and the admin
 * can ask the same questions, and so the answers are testable without a database.
 */

export type PhotoBookGate = {
	/** `photosEnabled`: the master switch. Off, the book does not exist for anyone. */
	enabled: boolean;
	/** `photosOpenAt`: uploads open at this moment. Null means no date gate at all. */
	openAt: Date | null;
	/** `photosTestMode`: open it right now, whatever the date says. */
	testMode: boolean;
};

export type PhotoBookAccess =
	/** The couple has not turned the book on: the route 404s. */
	| { state: "disabled" }
	/** Turned on, but the day has not arrived: guests see the date, not the camera. */
	| { state: "closed"; opensAt: Date }
	/** Guests can add photos and page through the book. */
	| { state: "open" };

export function resolvePhotoBookAccess(gate: PhotoBookGate, now: Date): PhotoBookAccess {
	if (!gate.enabled) {
		return { state: "disabled" };
	}
	if (gate.testMode || gate.openAt === null || now.getTime() >= gate.openAt.getTime()) {
		return { state: "open" };
	}
	return { state: "closed", opensAt: gate.openAt };
}

export const MAX_CAPTION_LENGTH = 140;
export const MAX_PHOTO_BATCH = 20;

export type BookPhoto = {
	id: string;
	url: string;
	uploaderName: string;
	caption: string;
};

export type BookPage =
	/** The front cover: couple names and the book's title. */
	| { kind: "cover" }
	/** The opening note the couple wrote. */
	| { kind: "intro" }
	| { kind: "photo"; photo: BookPhoto }
	/** The closing page, which invites whoever is reading to add one more. */
	| { kind: "end" };

/*
 * The book's page order. Cover and intro come first so a book with no photos yet is still a book
 * you can open, and the end page always closes it. Newest photos go last, so the book reads in
 * the order the day happened.
 */
export function buildBookPages(photos: BookPhoto[], hasIntro: boolean): BookPage[] {
	return [
		{ kind: "cover" as const },
		...(hasIntro ? [{ kind: "intro" as const }] : []),
		...photos.map((photo) => ({ kind: "photo" as const, photo })),
		{ kind: "end" as const },
	];
}

/*
 * Pages grouped into the physical leaves of a book. A spread (two pages facing each other) puts
 * two pages on one leaf — front and back — so turning it reveals the next two; a single-page
 * layout, which is what a phone gets, puts one page on each leaf. The last leaf of a spread may
 * have no back page, exactly like the last sheet of a real book.
 */
export function buildLeaves(pages: BookPage[], pagesPerLeaf: 1 | 2): (BookPage | null)[][] {
	const leaves: (BookPage | null)[][] = [];
	for (let index = 0; index < pages.length; index += pagesPerLeaf) {
		const leaf: (BookPage | null)[] = [];
		for (let offset = 0; offset < pagesPerLeaf; offset += 1) {
			leaf.push(pages[index + offset] ?? null);
		}
		leaves.push(leaf);
	}
	return leaves;
}

// A turned desktop leaf leaves its back face visible on the left. Phones have no visible backs.
export function lastBookPosition(pageCount: number, pagesPerLeaf: 1 | 2): number {
	return Math.max(0, pagesPerLeaf === 2 ? Math.floor(pageCount / 2) : pageCount - 1);
}

export function positionForPage(pageIndex: number, pagesPerLeaf: 1 | 2): number {
	return pagesPerLeaf === 2 ? Math.ceil(pageIndex / 2) : pageIndex;
}

export function visibleBookPage(turned: number, pagesPerLeaf: 1 | 2, pageCount: number): number {
	return Math.max(0, Math.min(turned * pagesPerLeaf, pageCount - 1));
}
