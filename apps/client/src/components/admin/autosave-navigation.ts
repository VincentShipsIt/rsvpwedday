"use client";

// One coordinator covers pages with several independently saved blocks. Navigation waits for
// every draft, so returning immediately cannot hydrate an editor from a pre-save response.
type PendingEditor = { readonly dirty: boolean; flush: () => Promise<void> };
const editors = new Set<PendingEditor>();
let navigating = false;

async function handleNavigation(event: MouseEvent) {
	if (
		event.defaultPrevented ||
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey
	)
		return;
	const anchor =
		event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
	if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self"))
		return;
	const destination = new URL(anchor.href, window.location.href);
	if (
		destination.origin !== window.location.origin ||
		(destination.pathname === window.location.pathname &&
			destination.search === window.location.search)
	)
		return;
	if (![...editors].some((editor) => editor.dirty)) return;
	event.preventDefault();
	if (navigating) return;
	navigating = true;
	try {
		await Promise.all([...editors].map((editor) => editor.flush()));
		if (![...editors].some((editor) => editor.dirty) && anchor.isConnected) anchor.click();
	} finally {
		navigating = false;
	}
}

export function registerAutosaveNavigation(editor: PendingEditor): () => void {
	if (editors.size === 0) document.addEventListener("click", handleNavigation, true);
	editors.add(editor);
	return () => {
		editors.delete(editor);
		if (editors.size === 0) document.removeEventListener("click", handleNavigation, true);
	};
}
