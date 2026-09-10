/*
 * Nothing the couple can remove is destroyed. Every row they can lose by mis-clicking carries a
 * `deletedAt`, and removing it sets that column instead of issuing a DELETE, so anything can be
 * put back.
 *
 * `deletedAt` rather than `isDeleted`: it answers "when", which is what a restore list and any
 * later purge policy need, and it matches `Photo.hiddenAt` already in the schema. "Is it deleted"
 * is just `deletedAt !== null`.
 *
 * What is NOT here, and why. Five deletes in the app are mechanical rather than something anyone
 * would want back, and tombstoning them would break the feature outright:
 *
 * - `GiftClaim` — releasing a reservation. `giftId` is the primary key, so a tombstone would mean
 *   that gift could never be reserved again.
 * - `EventAttendance` — re-syncing which events a household is invited to. Same problem: the
 *   primary key is the pair, so a tombstone would block ever re-inviting them.
 * - Guest-added companions, replaced wholesale on every RSVP edit — one tombstone per edit.
 * - Translation rows and block items' translations, rewritten on every save.
 *
 * Those stay real deletes. The nine below are the ones a person chose to remove.
 */

export const SOFT_DELETED_MODELS = [
	"event",
	"page",
	"block",
	"blockItem",
	"gift",
	"storyMilestone",
	"invitation",
	"guest",
	"photo",
] as const;

export type SoftDeletedModel = (typeof SOFT_DELETED_MODELS)[number];

/*
 * Matched case-insensitively on purpose. A Prisma client extension is handed the model as it is
 * written in the schema (`"Gift"`, `"StoryMilestone"`), while the client's own delegates are
 * camel-case (`db.gift`), and quietly matching neither is exactly how the filter silently stops
 * working — which it did, once.
 */
const softDeleted = new Set<string>(SOFT_DELETED_MODELS.map((model) => model.toLowerCase()));

export function isSoftDeletedModel(model: string | undefined): boolean {
	return model !== undefined && softDeleted.has(model.toLowerCase());
}

/*
 * The filter for a nested relation. `src/lib/db.ts` hides tombstones from every top-level read,
 * but a Prisma extension cannot reach inside an `include`, so a relation that loads soft-deletable
 * rows — a page's blocks, a household's guests — carries this in its own `where`.
 */
export const notDeleted = { deletedAt: null } as const;

/*
 * Freeing a unique value on delete.
 *
 * `Event.slug`, `Page.slug` and `Invitation.email`/`token` are unique across the whole table, and
 * Postgres does not care that a row is tombstoned. Left alone, a deleted "welcome-dinner" would
 * make that slug unusable forever, and — worse, because it fails silently — re-importing a deleted
 * household's CSV row would look up its email, not find it (reads hide deleted rows), try to
 * create it, and collide.
 *
 * So a delete moves the value out of the live namespace by suffixing it, and a restore strips the
 * suffix back off. The original is recoverable from the stored value itself, which is why the
 * marker is a fixed separator rather than a random string.
 */
const DELETED_MARKER = "__deleted__";

export function retireUniqueValue(value: string, at: Date): string {
	// Already retired: keep the first retirement, so deleting twice cannot nest the markers.
	if (value.includes(DELETED_MARKER)) {
		return value;
	}
	return `${value}${DELETED_MARKER}${at.getTime()}`;
}

export function restoreUniqueValue(value: string): string {
	const marker = value.indexOf(DELETED_MARKER);
	return marker === -1 ? value : value.slice(0, marker);
}

export function isRetiredUniqueValue(value: string): boolean {
	return value.includes(DELETED_MARKER);
}
