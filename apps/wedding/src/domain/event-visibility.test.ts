import { describe, expect, it } from "vitest";
import { publicEvents } from "@/domain/event-visibility";
import { filterToInvited, invitedEventIds } from "@/domain/invitation-events";

const welcomeDinner = { id: "welcome-dinner", showPublicly: false };
const ceremony = { id: "ceremony", showPublicly: true };
const reception = { id: "reception", showPublicly: true };
const events = [welcomeDinner, ceremony, reception];

describe("publicEvents", () => {
	it("drops the events the couple keeps off the public site", () => {
		expect(publicEvents(events)).toEqual([ceremony, reception]);
	});

	it("keeps the couple's order", () => {
		expect(publicEvents([reception, ceremony]).map((event) => event.id)).toEqual([
			"reception",
			"ceremony",
		]);
	});

	it("shows everything when nothing is hidden, which is what an untouched database looks like", () => {
		const allPublic = events.map((event) => ({ ...event, showPublicly: true }));
		expect(publicEvents(allPublic)).toHaveLength(3);
	});
});

/*
 * The point of the whole feature: a hidden event still reaches the household invited to it. These
 * two filters must stay independent, so this asserts the combination rather than either alone.
 */
describe("a hidden event and the guests invited to it", () => {
	const invitedToDinner = [
		{ attendance: [{ eventId: "welcome-dinner" }, { eventId: "ceremony" }] },
	];
	const notInvitedToDinner = [{ attendance: [{ eventId: "ceremony" }] }];

	it("still shows on the invitation of a household invited to it", () => {
		const theirs = filterToInvited(events, invitedEventIds(invitedToDinner));
		expect(theirs.map((event) => event.id)).toEqual(["welcome-dinner", "ceremony"]);
	});

	it("never shows on the invitation of a household that was not invited", () => {
		const theirs = filterToInvited(events, invitedEventIds(notInvitedToDinner));
		expect(theirs.map((event) => event.id)).toEqual(["ceremony"]);
	});

	it("never shows on the public site, whoever is reading", () => {
		expect(publicEvents(events).map((event) => event.id)).not.toContain("welcome-dinner");
	});
});
