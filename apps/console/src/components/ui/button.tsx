import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors transition-transform outline-none focus-visible:ring-2 focus-visible:ring-saffron/50 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default: "bg-ink text-paper hover:bg-ink/90",
				outline: "border border-line bg-panel text-ink hover:border-ink/40",
				ghost: "text-ink-soft hover:bg-ink/5 hover:text-ink",
				saffron: "bg-saffron text-paper hover:bg-saffron/90",
			},
			size: {
				default: "h-9 px-3",
				sm: "h-8 px-2.5 text-xs",
			},
		},
		defaultVariants: { variant: "default", size: "default" },
	}
);

export function Button({
	className,
	variant,
	size,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants> & { children: ReactNode }) {
	return (
		<button type="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />
	);
}

export function ButtonLink({
	href,
	className,
	variant,
	size,
	external = false,
	children,
}: VariantProps<typeof buttonVariants> & {
	href: string;
	className?: string;
	external?: boolean;
	children: ReactNode;
}) {
	return (
		<a
			href={href}
			className={cn(buttonVariants({ variant, size }), className)}
			{...(external ? { target: "_blank", rel: "noreferrer" } : undefined)}
		>
			{children}
		</a>
	);
}
