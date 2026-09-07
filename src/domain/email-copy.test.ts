import { describe, expect, it } from "vitest";
import { resolveEmailCopy } from "@/domain/email-copy";
import { en } from "@/i18n/dictionaries/en";

const vars = { name: "Sam", coupleNames: "A & B", deadline: "1 May 2027" };

describe("resolveEmailCopy", () => {
	it("falls back to the dictionary when there is no override", () => {
		const copy = resolveEmailCopy("INVITE", en, null, vars);
		expect(copy.subject).toBe("You're invited: A & B");
		expect(copy.heading).toBe("You're invited, Sam");
		expect(copy.bodyHtml).toBe(
			"<p>We would love to have you celebrate with us. Please let us know if you can make it by 1 May 2027.</p>"
		);
		expect(copy.cta).toBe("RSVP now");
	});

	it("uses each overridden field and keeps defaults for the empty ones", () => {
		const copy = resolveEmailCopy(
			"REMINDER",
			en,
			{ subject: "", heading: "Hi {name}!", body: "<p>See you on <strong>{deadline}</strong></p>" },
			vars
		);
		expect(copy.subject).toBe("Reminder: RSVP for A & B");
		expect(copy.heading).toBe("Hi Sam!");
		expect(copy.bodyHtml).toBe("<p>See you on <strong>1 May 2027</strong></p>");
	});

	it("treats an empty editor document as no override", () => {
		const copy = resolveEmailCopy(
			"CONFIRMATION",
			en,
			{ subject: "", heading: "", body: "<p></p>" },
			vars
		);
		expect(copy.bodyHtml).toContain("We've recorded your RSVP");
		expect(copy.cta).toBeNull();
	});

	it("sanitises markup in an override", () => {
		const copy = resolveEmailCopy(
			"INVITE",
			en,
			{ subject: "", heading: "", body: '<p onclick="x()">hi</p><script>1</script>' },
			vars
		);
		expect(copy.bodyHtml).toBe("<p>hi</p>");
	});
});
