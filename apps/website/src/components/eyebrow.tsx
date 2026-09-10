import { cn } from "@/lib/cn";

/*
 * The label register: 10–11px, uppercase, opened right up. Measured across
 * the reference houses it sits between 2px and 6.2px of tracking; 0.26em
 * lands mid-range at this size. It is always the sans, never the display.
 */
export function Eyebrow({ children, className }: { children: string; className?: string }) {
	return (
		<p
			className={cn("text-[10px] font-medium tracking-[0.26em] text-ink-soft uppercase", className)}
		>
			{children}
		</p>
	);
}
