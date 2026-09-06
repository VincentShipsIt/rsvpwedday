"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormActionResult } from "@/lib/form-action";

export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export type UseAutosaveOptions<T> = {
	value: T;
	save: (value: T) => Promise<FormActionResult>;
	debounceMs?: number;
};

export type UseAutosaveResult = {
	status: AutosaveStatus;
	error: string | null;
	retry: () => void;
};

const DEFAULT_DEBOUNCE_MS = 1500;

// Debounced autosave for the admin website/settings forms: fires `save` a fixed delay after
// `value` stops changing, skips the initial mount, and never lets two saves race — a value that
// arrives mid-save is queued and run once the in-flight save settles instead of overlapping it.
export function useAutosave<T>({
	value,
	save,
	debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseAutosaveOptions<T>): UseAutosaveResult {
	const [status, setStatus] = useState<AutosaveStatus>("idle");
	const [error, setError] = useState<string | null>(null);

	const hasMountedRef = useRef(false);
	const savedSnapshotRef = useRef(JSON.stringify(value));
	const isSavingRef = useRef(false);
	const queuedValueRef = useRef<T | null>(null);
	const hasQueuedRef = useRef(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const valueRef = useRef(value);
	const saveRef = useRef(save);

	valueRef.current = value;
	saveRef.current = save;

	const runSave = useCallback(async (nextValue: T) => {
		isSavingRef.current = true;
		setStatus("saving");
		setError(null);
		try {
			const result = await saveRef.current(nextValue);
			if (result.ok) {
				savedSnapshotRef.current = JSON.stringify(nextValue);
				setStatus("saved");
			} else {
				setError(result.error);
				setStatus("error");
			}
		} catch {
			setError("Something went wrong while saving.");
			setStatus("error");
		} finally {
			isSavingRef.current = false;
		}
		if (hasQueuedRef.current) {
			const queued = queuedValueRef.current as T;
			hasQueuedRef.current = false;
			queuedValueRef.current = null;
			await runSave(queued);
		}
	}, []);

	const flush = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		const current = valueRef.current;
		if (JSON.stringify(current) === savedSnapshotRef.current) {
			return;
		}
		if (isSavingRef.current) {
			queuedValueRef.current = current;
			hasQueuedRef.current = true;
			return;
		}
		runSave(current);
	}, [runSave]);

	useEffect(() => {
		if (!hasMountedRef.current) {
			hasMountedRef.current = true;
			return;
		}

		if (JSON.stringify(value) === savedSnapshotRef.current) {
			return;
		}

		setStatus("pending");
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		timeoutRef.current = setTimeout(() => {
			timeoutRef.current = null;
			const latest = valueRef.current;
			if (isSavingRef.current) {
				queuedValueRef.current = latest;
				hasQueuedRef.current = true;
				return;
			}
			runSave(latest);
		}, debounceMs);

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		};
	}, [value, debounceMs, runSave]);

	useEffect(() => {
		function handleVisibilityChange() {
			if (document.visibilityState === "hidden") {
				flush();
			}
		}
		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("beforeunload", flush);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("beforeunload", flush);
		};
	}, [flush]);

	const retry = useCallback(() => {
		flush();
	}, [flush]);

	return { status, error, retry };
}
