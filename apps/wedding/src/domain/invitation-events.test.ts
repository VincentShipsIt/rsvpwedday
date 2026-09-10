import { describe, expect, it } from "vitest";
import { filterToInvited, invitedEventIds } from "@/domain/invitation-events";

describe("invitedEventIds", () => {
	it("unions the events every guest holds a row for", () => {
		expect(
			invitedEventIds([
				{ attendance: [{ eventId: "a" }, { eventId: "b" }] },
				{ attendance: [{ eventId: "b" }, { eventId: "c" }] },
			])
		).toEqual(["a", "b", "c"]);
	});

	it("is empty when no guest has any row", () => {
		expect(invitedEventIds([{ attendance: [] }])).toEqual([]);
	});
});

describe("filterToInvited", () => {
	it("keeps the site's event order and drops uninvited events", () => {
		const events = [{ id: "a" }, { id: "b" }, { id: "c" }];
		expect(filterToInvited(events, ["c", "a"])).toEqual([{ id: "a" }, { id: "c" }]);
	});
});
