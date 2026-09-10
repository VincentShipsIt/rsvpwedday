import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
	return (
		<input
			className={cn(
				"h-9 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-saffron/50",
				className
			)}
			{...props}
		/>
	);
}
