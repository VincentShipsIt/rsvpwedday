import { describe, expect, it } from "vitest";
import {
	buildIllustrationPrompt,
	type IllustrationContext,
	illustrationAspectRatio,
} from "@/domain/illustration-prompt";
import { SiteTheme } from "@/generated/prisma/enums";

const context: IllustrationContext = {
	theme: SiteTheme.MEDITERRANEAN,
	coupleNames: "A & B",
	places: ["Villa Example, 1 Example Street"],
};

describe("buildIllustrationPrompt", () => {
	it("carries the theme's art direction, the couple and the real setting", () => {
		const prompt = buildIllustrationPrompt({ placement: "hero" }, context);

		expect(prompt).toContain("A & B");
		expect(prompt).toContain("#fdf9ec");
		expect(prompt).toContain("Villa Example, 1 Example Street");
	});

	it("uses a different art direction for a different theme", () => {
		const midnight = buildIllustrationPrompt(
			{ placement: "hero" },
			{ ...context, theme: SiteTheme.MIDNIGHT }
		);

		expect(midnight).toContain("#0f1113");
		expect(midnight).not.toContain("#fdf9ec");
	});

	it("describes the block's own content as the subject, as plain text", () => {
		const prompt = buildIllustrationPrompt(
			{
				placement: "story",
				dateLabel: "Summer 2019",
				title: "The lemon stall",
				body: "<p>We met buying <strong>lemons</strong>.</p>",
			},
			context
		);

		expect(prompt).toContain("Summer 2019 — The lemon stall — We met buying lemons.");
		expect(prompt).not.toContain("<strong>");
	});

	it("falls back to the placement brief when the block has no copy yet", () => {
		const prompt = buildIllustrationPrompt({ placement: "guideItem", title: "  " }, context);

		expect(prompt).toContain("one place, dish or object");
		expect(prompt).not.toContain("It illustrates:");
	});

	it("refuses to invent a landmark when no venue is recorded", () => {
		const prompt = buildIllustrationPrompt({ placement: "hero" }, { ...context, places: [] });

		expect(prompt).toContain("unplaceable");
	});

	it("forbids lettering and faces in every prompt", () => {
		for (const placement of ["hero", "gallery", "guideSection"] as const) {
			const prompt = buildIllustrationPrompt({ placement }, context);
			expect(prompt).toContain("No text, letters, numbers");
			expect(prompt).toContain("No recognisable faces");
		}
	});
});

describe("illustrationAspectRatio", () => {
	it("frames each placement the way the site crops it", () => {
		expect(illustrationAspectRatio("hero")).toBe("16:9");
		expect(illustrationAspectRatio("gallery")).toBe("1:1");
		expect(illustrationAspectRatio("guideItem")).toBe("3:2");
	});
});
