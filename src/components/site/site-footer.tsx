import type { SiteTheme } from "@/generated/prisma/enums";
import { dataTheme } from "@/lib/site-theme";

export function SiteFooter({
	line,
	theme,
	hasThemePicker = false,
}: {
	line: string;
	theme: SiteTheme;
	/** `?pick=1`'s fixed bottom bar (ThemePicker) would otherwise sit on top of this footer. */
	hasThemePicker?: boolean;
}) {
	return (
		<footer
			data-theme={dataTheme[theme]}
			className={`border-t border-ink/10 px-6 py-10 text-center text-sm text-ink/60 ${
				hasThemePicker ? "pb-28" : ""
			}`}
		>
			<p>{line}</p>
		</footer>
	);
}
