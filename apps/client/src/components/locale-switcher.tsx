import type { Locale } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";

export function LocaleSwitcher({
	currentLocale,
	action,
	label,
}: {
	currentLocale: Locale;
	action: (formData: FormData) => Promise<void>;
	label: string;
}) {
	return (
		<form action={action} className="flex items-center gap-2">
			<label htmlFor="locale" className="sr-only">
				{label}
			</label>
			<select
				id="locale"
				name="locale"
				defaultValue={currentLocale}
				className="rounded-md border border-ink/15 bg-white px-2 py-1 text-sm"
			>
				{localeCodes.map((code) => (
					<option key={code} value={code}>
						{locales[code].label}
					</option>
				))}
			</select>
			<button type="submit" className="text-sm text-green underline underline-offset-4">
				{label}
			</button>
		</form>
	);
}
