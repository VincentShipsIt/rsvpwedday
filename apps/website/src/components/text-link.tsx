import { cn } from "@/lib/cn";

export function TextLink({
	href,
	children,
	className,
}: {
	href: string;
	children: string;
	className?: string;
}) {
	const isExternal = href.startsWith("http");
	return (
		<a
			href={href}
			className={cn(
				"inline-flex items-center gap-2 text-sm tracking-wide text-ink underline decoration-saffron/70 decoration-1 underline-offset-6 transition-colors hover:text-saffron",
				className
			)}
			{...(isExternal ? { target: "_blank", rel: "noreferrer" } : undefined)}
		>
			{children}
		</a>
	);
}
