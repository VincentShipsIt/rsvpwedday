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
				"inline-block border-b border-ink/25 pb-1 text-[13px] tracking-[0.04em] text-ink transition-colors hover:border-ink",
				className
			)}
			{...(isExternal ? { target: "_blank", rel: "noreferrer" } : undefined)}
		>
			{children}
		</a>
	);
}
