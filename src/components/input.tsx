import type { ComponentProps } from "react";

export const fieldClassName =
	"w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-green focus:outline-none focus:ring-1 focus:ring-green";

export function Input({ className = "", ...props }: ComponentProps<"input">) {
	return <input className={`${fieldClassName} ${className}`} {...props} />;
}
