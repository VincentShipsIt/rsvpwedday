import { env } from "@/lib/env";

/*
 * Illustration generation runs on Replicate's official `google/nano-banana-2-lite` model, called
 * over plain fetch — the whole surface is one POST, so the client library would earn nothing.
 * Official models are addressed by name and need no version id.
 */
const MODEL = "google/nano-banana-2-lite";
const PREDICTIONS_URL = `https://api.replicate.com/v1/models/${MODEL}/predictions`;

// Replicate holds the response open until the prediction settles or this many seconds pass; the
// lite model normally finishes well inside it, and the poll loop below covers the rest of our
// own budget (the route's `maxDuration`).
const WAIT_SECONDS = 45;
const DEADLINE_MS = 55_000;
const POLL_INTERVAL_MS = 1_500;

export type GeneratedImage = { ok: true; url: string } | { ok: false; error: string };

type Prediction = {
	status: string;
	output?: unknown;
	error?: unknown;
	urls?: { get?: string };
};

export function isImageGenerationConfigured(): boolean {
	return Boolean(env.REPLICATE_API_TOKEN);
}

// The schema declares a single uri, but Replicate's image models are inconsistent about wrapping
// one in an array, so both shapes are read.
function readOutputUrl(output: unknown): string | undefined {
	if (typeof output === "string") {
		return output;
	}
	if (Array.isArray(output) && typeof output[0] === "string") {
		return output[0];
	}
	return undefined;
}

function readError(prediction: Prediction): string {
	if (typeof prediction.error === "string" && prediction.error.trim() !== "") {
		return prediction.error;
	}
	return `Image generation ${prediction.status}.`;
}

async function poll(url: string, token: string, deadline: number): Promise<Prediction | undefined> {
	while (Date.now() < deadline) {
		await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
		const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
		if (!response.ok) {
			return undefined;
		}
		const prediction = (await response.json()) as Prediction;
		if (prediction.status !== "starting" && prediction.status !== "processing") {
			return prediction;
		}
	}
	return undefined;
}

export async function generateImage(input: {
	prompt: string;
	aspectRatio: string;
}): Promise<GeneratedImage> {
	const token = env.REPLICATE_API_TOKEN;
	if (!token) {
		return { ok: false, error: "Image generation needs a Replicate token." };
	}

	const deadline = Date.now() + DEADLINE_MS;
	const response = await fetch(PREDICTIONS_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			Prefer: `wait=${WAIT_SECONDS}`,
		},
		body: JSON.stringify({
			input: {
				prompt: input.prompt,
				aspect_ratio: input.aspectRatio,
				output_format: "jpg",
			},
		}),
	});

	if (!response.ok) {
		const detail = await response.text();
		return { ok: false, error: `Replicate refused the request (${response.status}): ${detail}` };
	}

	let prediction = (await response.json()) as Prediction;
	if (prediction.status === "starting" || prediction.status === "processing") {
		const settled = prediction.urls?.get
			? await poll(prediction.urls.get, token, deadline)
			: undefined;
		if (!settled) {
			return { ok: false, error: "The image took too long to generate. Try again." };
		}
		prediction = settled;
	}

	const url = readOutputUrl(prediction.output);
	if (prediction.status !== "succeeded" || !url) {
		return { ok: false, error: readError(prediction) };
	}

	return { ok: true, url };
}
