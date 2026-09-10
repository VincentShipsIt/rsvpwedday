import type { FormActionResult } from "@/lib/form-action";

export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";
export type AutosaveState = { status: AutosaveStatus; error: string | null };

// The promise owns the save, independently of the editor's lifetime. Always reconcile the
// latest draft after an in-flight write, including a reversion to the previous saved value.
export class Autosave<T> {
	private current: T;
	private saved: string;
	private running: Promise<void> | null = null;
	private listeners = new Set<(state: AutosaveState) => void>();
	state: AutosaveState = { status: "idle", error: null };

	constructor(
		initial: T,
		private save: (value: T) => Promise<FormActionResult>,
		private onDetachedError?: (retry: () => void) => void
	) {
		this.current = initial;
		this.saved = JSON.stringify(initial);
	}

	get dirty(): boolean {
		return Boolean(this.running) || JSON.stringify(this.current) !== this.saved;
	}

	subscribe(listener: (state: AutosaveState) => void): () => void {
		this.listeners.add(listener);
		listener(this.state);
		return () => {
			this.listeners.delete(listener);
		};
	}

	private publish(state: AutosaveState) {
		this.state = state;
		for (const listener of this.listeners) listener(state);
	}

	update(value: T) {
		this.current = value;
		if (this.running) return;
		this.publish({
			status: this.dirty ? "pending" : this.state.status === "idle" ? "idle" : "saved",
			error: null,
		});
	}

	flush(): Promise<void> {
		if (this.running) return this.running;
		if (!this.dirty) return Promise.resolve();
		this.running = this.persist().finally(() => {
			this.running = null;
		});
		return this.running;
	}

	private async persist() {
		while (JSON.stringify(this.current) !== this.saved) {
			const value = this.current;
			const snapshot = JSON.stringify(value);
			this.publish({ status: "saving", error: null });
			let result: FormActionResult;
			try {
				result = await this.save(value);
			} catch {
				result = { ok: false, error: "Something went wrong while saving." };
			}
			if (!result.ok) {
				this.publish({ status: "error", error: result.error });
				if (this.listeners.size === 0)
					this.onDetachedError?.(() => {
						void this.flush();
					});
				return;
			}
			this.saved = snapshot;
		}
		this.publish({ status: "saved", error: null });
	}
}
