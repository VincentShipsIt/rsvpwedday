export type EffectsSettings = {
	/** Seconds the cover holds (after assets load) before offering its button. */
	openingHoldSeconds: number;
	/** Reveal speed as a percentage: 200 plays the open animation twice as fast. */
	openingSpeed: number;
	/** Particles in one burst, before the small-screen reduction. */
	particleCount: number;
	/** Seconds a burst stays at full strength before fading; 0 keeps it going. */
	particleSeconds: number;
	/** Particle drift speed as a percentage. */
	particleSpeed: number;
	/** Background-music playback volume as a percentage of full. */
	musicVolume: number;
};

export const defaultEffectsSettings: EffectsSettings = {
	openingHoldSeconds: 2,
	openingSpeed: 100,
	particleCount: 30,
	particleSeconds: 6,
	particleSpeed: 100,
	musicVolume: 40,
};

export const effectsLimits: Record<keyof EffectsSettings, { min: number; max: number }> = {
	openingHoldSeconds: { min: 0, max: 10 },
	openingSpeed: { min: 25, max: 300 },
	particleCount: { min: 0, max: 150 },
	particleSeconds: { min: 0, max: 120 },
	particleSpeed: { min: 25, max: 300 },
	musicVolume: { min: 0, max: 100 },
};

const settingKeys = Object.keys(defaultEffectsSettings) as (keyof EffectsSettings)[];

// Whatever the admin form or the database hands over becomes a whole number inside its limits;
// anything unusable (missing, NaN, a string) falls back to the default for that knob.
export function clampEffectsSettings(
	input: Partial<Record<keyof EffectsSettings, unknown>>
): EffectsSettings {
	const settings = { ...defaultEffectsSettings };
	for (const key of settingKeys) {
		const raw = input[key];
		const value = typeof raw === "number" ? raw : Number.NaN;
		if (Number.isFinite(value)) {
			const { min, max } = effectsLimits[key];
			settings[key] = Math.min(max, Math.max(min, Math.round(value)));
		}
	}
	return settings;
}
