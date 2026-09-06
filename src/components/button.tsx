import type { ComponentProps } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variantClassNames: Record<ButtonVariant, string> = {
	primary: "bg-green text-ivory hover:bg-green-dark",
	secondary: "border border-green text-green hover:bg-ivory-dark",
	ghost: "text-green underline-offset-4 hover:underline",
};

export function Button({
	variant = "primary",
	className = "",
	...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
	return (
		<button
			className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClassNames[variant]} ${className}`}
			{...props}
		/>
	);
}
