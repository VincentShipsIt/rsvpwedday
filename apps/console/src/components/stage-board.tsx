import { Badge } from "@rsvpwedday/ui/badge";
import { Button } from "@rsvpwedday/ui/button";
import Link from "next/link";

export function StageBoard<T extends string>({
	columns,
	items,
	move,
}: {
	columns: Array<{ id: T; label: string }>;
	items: Array<{
		id: string;
		href: string;
		title: string;
		meta: string;
		column: T;
	}>;
	move: (id: string, column: T) => Promise<void>;
}) {
	return (
		<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
			{columns.map((column) => {
				const cards = items.filter((item) => item.column === column.id);
				return (
					<section
						key={column.id}
						className="min-w-0 rounded-xl bg-card p-3 ring-1 ring-foreground/10"
					>
						<header className="mb-3 flex items-center justify-between gap-2 px-1">
							<h2 className="text-sm font-semibold">{column.label}</h2>
							<Badge variant="secondary">{cards.length}</Badge>
						</header>
						<ul className="flex flex-col gap-2">
							{cards.map((card) => (
								<li
									key={card.id}
									className="rounded-lg bg-background p-3 ring-1 ring-foreground/10"
								>
									<Link href={card.href} className="font-medium hover:text-foreground">
										{card.title}
									</Link>
									<p className="text-muted-foreground mt-1 text-xs">{card.meta}</p>
									<div className="mt-2 flex flex-wrap gap-1">
										{columns
											.filter((next) => next.id !== column.id)
											.slice(0, 3)
											.map((next) => (
												<form key={next.id} action={move.bind(null, card.id, next.id)}>
													<Button type="submit" size="xs" variant="ghost">
														{next.label}
													</Button>
												</form>
											))}
									</div>
								</li>
							))}
						</ul>
					</section>
				);
			})}
		</div>
	);
}
