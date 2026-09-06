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
		<div className="relative inline-flex items-center">
			<select
				aria-label={label}
				value={locale}
				onChange={handleChange}
				className="appearance-none rounded-md border border-ink/15 bg-transparent py-1.5 pl-3 pr-8 text-sm text-ink/80 hover:border-green hover:text-green focus:border-green focus:outline-none focus:ring-1 focus:ring-green"
			>
				{localeCodes.map((code) => (
					<option key={code} value={code}>
						{locales[code].label}
					</option>
				))}
			</select>
			<svg
				aria-hidden="true"
				viewBox="0 0 20 20"
				className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-ink/50"
			>
				<path
					fill="currentColor"
					d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.23 8.29a.75.75 0 0 1 0-1.08Z"
				/>
			</svg>
		</div>
	);
}
