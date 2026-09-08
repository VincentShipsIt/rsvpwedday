"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { registerAutosaveNavigation } from "@/components/admin/autosave-navigation";
import { Autosave, type AutosaveState, type AutosaveStatus } from "@/domain/autosave";
import type { FormActionResult } from "@/lib/form-action";

export type { AutosaveStatus };
export type UseAutosaveOptions<T> = {
	value: T;
	save: (value: T) => Promise<FormActionResult>;
	debounceMs?: number;
};
export type UseAutosaveResult = { status: AutosaveStatus; error: string | null; retry: () => void };

export function useAutosave<T>({
	value,
	save,
	debounceMs = 1500,
}: UseAutosaveOptions<T>): UseAutosaveResult {
	const saveRef = useRef(save);
	saveRef.current = save;
	const controllerRef = useRef<Autosave<T> | null>(null);
	if (!controllerRef.current) {
		controllerRef.current = new Autosave(
			value,
			(draft) => saveRef.current(draft),
			(retry) => {
				toast.error("Your previous page has unsaved changes.", {
					duration: Infinity,
					action: { label: "Retry save", onClick: retry },
				});
			}
		);
	}
	const controller = controllerRef.current;
	const [state, setState] = useState<AutosaveState>(controller.state);
	const snapshot = JSON.stringify(value);
	const valueRef = useRef(value);
	valueRef.current = value;

	useEffect(() => controller.subscribe(setState), [controller]);
	useEffect(() => registerAutosaveNavigation(controller), [controller]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: compare serialized drafts, not freshly allocated form objects.
	useEffect(() => {
		controller.update(valueRef.current);
		if (!controller.dirty) return;
		const timer = setTimeout(() => {
			void controller.flush();
		}, debounceMs);
		return () => clearTimeout(timer);
	}, [controller, snapshot, debounceMs]);

	useEffect(() => {
		function flush() {
			controller.update(valueRef.current);
			void controller.flush();
		}
		function visibility() {
			if (document.visibilityState === "hidden") flush();
		}
		function beforeUnload(event: BeforeUnloadEvent) {
			controller.update(valueRef.current);
			if (!controller.dirty) return;
			flush();
			// The browser cannot guarantee a Server Action finishes during document teardown.
			event.preventDefault();
			event.returnValue = "";
		}
		document.addEventListener("visibilitychange", visibility);
		window.addEventListener("beforeunload", beforeUnload);
		return () => {
			document.removeEventListener("visibilitychange", visibility);
			window.removeEventListener("beforeunload", beforeUnload);
			// Next Link and browser back unmount without hiding the document. The controller and
			// its retry action survive that unmount until the current draft is durable.
			flush();
		};
	}, [controller]);

	const retry = useCallback(() => {
		void controller.flush();
	}, [controller]);
	return { ...state, retry };
}
