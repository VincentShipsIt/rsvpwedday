import Link from "next/link";
import type { SiteTheme } from "@/generated/prisma/enums";
import type { SiteLink } from "@/lib/site-links";
import { dataTheme } from "@/lib/site-theme";

export function SiteFooter({
	line,
	links,
	theme,
	hasThemePicker = false,
}: {
	line: string;
	/** Same list as the nav, so a guest scrolling past RSVP can still reach the guide or FAQ. */
	links: SiteLink[];
	theme: SiteTheme;
	/** `?pick=1`'s fixed bottom bar (ThemePicker) would otherwise sit on top of this footer. */
	hasThemePicker?: boolean;
}) {
	return (
		<footer
			data-theme={dataTheme[theme]}
			className={`flex flex-col items-center gap-6 border-t border-ink/10 px-6 py-10 text-center text-sm text-ink/60 ${
				hasThemePicker ? "pb-28" : ""
			}`}
		>
			{links.length > 0 && (
				<nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
					{links.map((link) => (
						<Link key={link.href} href={link.href} className="link-underline hover:text-green">
							{link.label}
						</Link>
					))}
				</nav>
			)}
			<p>{line}</p>
		</footer>
	);
}
