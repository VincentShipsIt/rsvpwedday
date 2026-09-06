"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import type { Locale } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";

export function LanguageSelect({ locale, label }: { locale: Locale; label: string }) {
	const router = useRouter();
	const searchParams = useSearchParams();

	function handleChange(changeEvent: ChangeEvent<HTMLSelectElement>) {
		const params = new URLSearchParams(searchParams.toString());
		params.set("lang", changeEvent.target.value);
		const hash = typeof window === "undefined" ? "" : window.location.hash;
		router.push(`/?${params.toString()}${hash}`);
	}

	return (
		// `text-current`/`border-current` (not a hardcoded ink color) so the closed control, its
		// hairline border, and the chevron all pick up whatever color the nav bar has resolved to —
		// light over a photo (`nav-over-photo`) in every theme including Midnight's dark bar, ink
		// once scrolled — instead of reading as a default grey form control dropped on the page.
		// The real `<select>` sits on top with its own text made transparent (`text-transparent`,
		// plus the WebKit-only fill property Safari needs to actually honor that), so it stays the
		// full-box click/tap target and keeps native keyboard behavior; the two spans beneath it
		// render the visible value instead, a short code below `sm:` and the full label from
		// `locales` from `sm:` up. `<option>` gets its own explicit dark-on-light colors because the
		// native option list renders on an opaque system background regardless of the closed
		// control's color, so inheriting a light `currentColor` there would make it unreadable.
		<div className="relative inline-flex min-h-11 min-w-16 items-center rounded-md border border-current/30 bg-transparent pr-8 pl-3 text-sm text-current transition-colors hover:border-current/60 focus-within:border-current focus-within:ring-1 focus-within:ring-current sm:min-w-28">
			<span aria-hidden="true" className="sm:hidden">
				{locale.toUpperCase()}
			</span>
			<span aria-hidden="true" className="hidden sm:inline">
				{locales[locale].label}
			</span>
			<select
				aria-label={label}
				value={locale}
				onChange={handleChange}
				className="absolute inset-0 h-full w-full cursor-pointer appearance-none text-transparent outline-none [-webkit-text-fill-color:transparent]"
			>
				{localeCodes.map((code) => (
					<option key={code} value={code} className="bg-ivory text-ink">
						{locales[code].label}
					</option>
				))}
			</select>
			<svg
				aria-hidden="true"
				viewBox="0 0 20 20"
				className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-current/70"
			>
				<path
					fill="currentColor"
					d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.23 8.29a.75.75 0 0 1 0-1.08Z"
				/>
			</svg>
		</div>
	);
}
