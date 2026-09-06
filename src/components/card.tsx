import type { ComponentProps } from "react";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
	return (
		<div
			className={`rounded-xl border border-ink/10 bg-white/60 p-6 shadow-sm ${className}`}
			{...props}
		/>
	);
}
