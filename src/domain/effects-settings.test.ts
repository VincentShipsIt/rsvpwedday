import { describe, expect, it } from "vitest";
import { clampEffectsSettings, defaultEffectsSettings } from "@/domain/effects-settings";

describe("clampEffectsSettings", () => {
	it("returns the defaults for an empty input", () => {
		expect(clampEffectsSettings({})).toEqual(defaultEffectsSettings);
	});

	it("keeps values that are inside their limits", () => {
		expect(clampEffectsSettings({ particleCount: 80, openingSpeed: 150 })).toMatchObject({
			particleCount: 80,
			openingSpeed: 150,
		});
	});

	it("clamps values to their limits and rounds them", () => {
		expect(
			clampEffectsSettings({ particleCount: 9999, openingSpeed: 1, particleSeconds: 2.6 })
		).toMatchObject({ particleCount: 150, openingSpeed: 25, particleSeconds: 3 });
	});

	it("falls back to the default for anything that is not a finite number", () => {
		expect(
			clampEffectsSettings({
				particleCount: Number.NaN,
				particleSpeed: "fast",
				openingHoldSeconds: null,
			})
		).toMatchObject({
			particleCount: defaultEffectsSettings.particleCount,
			particleSpeed: defaultEffectsSettings.particleSpeed,
			openingHoldSeconds: defaultEffectsSettings.openingHoldSeconds,
		});
	});
});
