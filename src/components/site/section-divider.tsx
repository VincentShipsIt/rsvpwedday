import { SiteTheme } from "@/generated/prisma/enums";

// Only GARDEN carries a decorative divider between sections; the other two themes rely on
// plain vertical rhythm instead.
export function SectionDivider({ theme }: { theme: SiteTheme }) {
	if (theme !== SiteTheme.GARDEN) {
		return null;
	}

	return (
		<div className="mx-auto flex max-w-4xl items-center justify-center px-6">
			<svg
				aria-hidden="true"
				viewBox="0 0 200 24"
				className="h-6 w-40 text-green"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
			>
				<path d="M0 12h68" strokeLinecap="round" />
				<path d="M132 12h68" strokeLinecap="round" />
				<path
					d="M100 12c-6-9-19-9-25 0 6 9 19 9 25 0Zm0 0c6-9 19-9 25 0-6 9-19 9-25 0Z"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</div>
	);
}
