import { LemonGlyph } from "@/components/site/lemon-sprig";
import { Reveal } from "@/components/site/reveal";
import { SiteTheme } from "@/generated/prisma/enums";

// Only GARDEN (a botanical rule) and MEDITERRANEAN (a lemon between two hairlines) carry a
// decorative divider between sections; the other themes rely on plain vertical rhythm instead.
export function SectionDivider({ theme }: { theme: SiteTheme }) {
	if (theme === SiteTheme.MEDITERRANEAN) {
		return <MediterraneanDivider />;
	}
	if (theme !== SiteTheme.GARDEN) {
		return null;
	}

	return (
		<Reveal className="mx-auto flex max-w-4xl items-center justify-center px-6">
			<svg
				aria-hidden="true"
				viewBox="0 0 200 24"
				className="h-6 w-40 text-green"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
			>
				{/* `pathLength="100"` normalizes each path's length to 100 regardless of its
				    actual geometry, so the `.divider-path` dasharray/dashoffset draw (globals.css)
				    works the same for every path here without hand-measuring stroke lengths. */}
				<path className="divider-path" pathLength={100} d="M0 12h68" strokeLinecap="round" />
				<path className="divider-path" pathLength={100} d="M132 12h68" strokeLinecap="round" />
				<path
					className="divider-path"
					pathLength={100}
					d="M100 12c-6-9-19-9-25 0 6 9 19 9 25 0Zm0 0c6-9 19-9 25 0-6 9-19 9-25 0Z"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</Reveal>
	);
}

function MediterraneanDivider() {
	return (
		<Reveal className="mx-auto flex max-w-4xl items-center justify-center gap-4 px-6 text-green">
			<svg aria-hidden="true" viewBox="0 0 80 2" className="h-0.5 w-20" fill="none">
				<path
					className="divider-path"
					pathLength={100}
					d="M0 1h80"
					stroke="currentColor"
					strokeWidth="1"
				/>
			</svg>
			<LemonGlyph className="h-6 w-8" />
			<svg aria-hidden="true" viewBox="0 0 80 2" className="h-0.5 w-20" fill="none">
				<path
					className="divider-path"
					pathLength={100}
					d="M0 1h80"
					stroke="currentColor"
					strokeWidth="1"
				/>
			</svg>
		</Reveal>
	);
}
