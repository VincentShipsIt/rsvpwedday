"use client";

import { cn } from "cn";
import { ExternalLinkIcon } from "lucide-react";
import { useId, useState } from "react";
import { updateEffects } from "@/app/admin/website/actions";
import { AudioField } from "@/components/admin/audio-field";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type EffectsSettings, effectsLimits } from "@/domain/effects-settings";
import type { OpeningAnimation } from "@/generated/prisma/enums";
import { openingChoices } from "@/lib/site-effects";

type SettingField = {
	key: keyof EffectsSettings;
	label: string;
	hint: string;
	unit: string;
};

const openingFields: SettingField[] = [
	{
		key: "openingHoldSeconds",
		label: "Hold time",
		hint: "How long the cover keeps animating after the page has loaded before the button appears.",
		unit: "s",
	},
	{
		key: "openingSpeed",
		label: "Reveal speed",
		hint: "100 is the designed pace; 200 opens twice as fast, 50 at half speed.",
		unit: "%",
	},
];

const particleFields: SettingField[] = [
	{
		key: "particleCount",
		label: "Amount",
		hint: "Particles in one burst on a laptop-sized screen; phones get proportionally fewer.",
		unit: "",
	},
	{
		key: "particleSeconds",
		label: "Duration",
		hint: "Seconds at full strength before they fade away. 0 keeps them going.",
		unit: "s",
	},
	{
		key: "particleSpeed",
		label: "Speed",
		hint: "100 is the designed drift; higher is livelier, lower is calmer.",
		unit: "%",
	},
];

function SettingInputs({
	fields,
	settings,
	onChange,
}: {
	fields: SettingField[];
	settings: EffectsSettings;
	onChange: (key: keyof EffectsSettings, value: number) => void;
}) {
	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{fields.map((field) => {
				const { min, max } = effectsLimits[field.key];
				return (
					<div key={field.key} className="flex flex-col gap-1.5">
						<Label htmlFor={`effects-${field.key}`}>
							{field.label}
							{field.unit && <span className="text-muted-foreground"> ({field.unit})</span>}
						</Label>
						<Input
							id={`effects-${field.key}`}
							type="number"
							inputMode="numeric"
							min={min}
							max={max}
							step={1}
							value={settings[field.key]}
							onChange={(event) => onChange(field.key, event.target.valueAsNumber)}
						/>
						<p className="text-xs text-muted-foreground">
							{field.hint} ({min}–{max})
						</p>
					</div>
				);
			})}
		</div>
	);
}

export type EffectsFormProps = {
	initialOpeningAnimation: OpeningAnimation;
	initialParticlesEnabled: boolean;
	initialMusicUrl: string;
	initialSettings: EffectsSettings;
	blobConfigured: boolean;
};

export function EffectsForm({
	initialOpeningAnimation,
	initialParticlesEnabled,
	initialMusicUrl,
	initialSettings,
	blobConfigured,
}: EffectsFormProps) {
	const particlesId = useId();
	const [openingAnimation, setOpeningAnimation] = useState(initialOpeningAnimation);
	const [particlesEnabled, setParticlesEnabled] = useState(initialParticlesEnabled);
	const [musicUrl, setMusicUrl] = useState(initialMusicUrl);
	const [settings, setSettings] = useState(initialSettings);

	const { status, error, retry } = useAutosave({
		value: { openingAnimation, particlesEnabled, musicUrl, ...settings },
		save: updateEffects,
	});

	function updateSetting(key: keyof EffectsSettings, value: number) {
		// A cleared field parses as NaN; keeping the last value means the autosave never sends
		// garbage, and the server clamps anything typed outside the range on its side too.
		if (Number.isFinite(value)) {
			setSettings((current) => ({ ...current, [key]: value }));
		}
	}

	return (
		<div className="flex flex-col gap-8">
			<Card>
				<CardHeader>
					<CardTitle>Opening animation</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-6">
					<div className="grid gap-4 sm:grid-cols-2">
						{openingChoices.map((choice) => {
							const isSelected = choice.opening === openingAnimation;
							return (
								// Same layering as the theme cards: the card is a plain container, the
								// selection control is a full-size button over it, and the preview link sits
								// above that button so both stay reachable.
								<div
									key={choice.key}
									className={cn(
										"relative flex flex-col gap-2 rounded-lg border p-4 transition-colors",
										isSelected ? "border-ring bg-accent" : "hover:bg-accent/50"
									)}
								>
									<button
										type="button"
										aria-pressed={isSelected}
										onClick={() => setOpeningAnimation(choice.opening)}
										className="absolute inset-0 z-10 rounded-lg"
									>
										<span className="sr-only">Select {choice.label}</span>
									</button>
									<div className="flex items-center justify-between">
										<span className="font-medium">{choice.label}</span>
										{isSelected && (
											<span className="text-xs font-medium text-muted-foreground">Selected</span>
										)}
									</div>
									<p className="text-sm text-muted-foreground">{choice.description}</p>
									{choice.key !== "none" && (
										<a
											href={`/?opening=${choice.key}`}
											target="_blank"
											rel="noreferrer"
											className="relative z-20 flex w-fit items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
										>
											Preview
											<ExternalLinkIcon className="size-3.5" aria-hidden="true" />
										</a>
									)}
								</div>
							);
						})}
					</div>
					<SettingInputs fields={openingFields} settings={settings} onChange={updateSetting} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Particles</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="flex items-center gap-2">
						<Checkbox
							id={particlesId}
							checked={particlesEnabled}
							onCheckedChange={(checked) => setParticlesEnabled(checked === true)}
						/>
						<Label htmlFor={particlesId}>Show ambient particles on the site</Label>
					</div>
					<p className="text-sm text-muted-foreground">
						Petals, bokeh, stars, dust, or confetti depending on the theme, bursting out of the
						opening animation. Guests who prefer reduced motion never see them.
					</p>
					<SettingInputs fields={particleFields} settings={settings} onChange={updateSetting} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Background music</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-2">
					<AudioField
						label="Track"
						value={musicUrl}
						onChange={setMusicUrl}
						blobConfigured={blobConfigured}
					/>
					<p className="text-sm text-muted-foreground">
						Starts when a guest opens the invitation, with a floating button to pause or resume.
						Leave empty for no music.
					</p>
				</CardContent>
			</Card>

			<div className="flex items-center gap-3">
				<Button type="button" variant="secondary" disabled={status === "saving"} onClick={retry}>
					Save now
				</Button>
				<SaveStatus status={status} error={error} onRetry={retry} />
			</div>
		</div>
	);
}
