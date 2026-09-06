import type { SiteTheme } from "@/generated/prisma/enums";
import { dataTheme } from "@/lib/site-theme";

export function SiteFooter({ line, theme }: { line: string; theme: SiteTheme }) {
	return (
		<footer
			data-theme={dataTheme[theme]}
			className="border-t border-ink/10 px-6 py-10 text-center text-sm text-ink/60"
		>
			<p>{line}</p>
		</footer>
	);
}
