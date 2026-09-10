import { Badge } from "@rsvpwedday/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rsvpwedday/ui/card";
import { ConsoleShell } from "@/components/console-shell";
import { categoryLabels, partners } from "@/lib/mock";

export default function PartnersPage() {
	return (
		<ConsoleShell active="/partners">
			<p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">Roster</p>
			<h1 className="mt-1 font-display text-4xl tracking-tight">Partners</h1>
			<p className="text-muted-foreground mt-2 max-w-xl">
				Houses, kitchens, flowers, photographers we actually work with. Not a public directory.
				Booking onto a wedding comes after the tenant lands.
			</p>
			<ul className="mt-10 grid gap-4 md:grid-cols-2">
				{partners.map((partner) => (
					<li key={partner.id}>
						<Card>
							<CardHeader>
								<Badge variant="secondary">{categoryLabels[partner.category]}</Badge>
								<CardTitle className="font-display text-2xl">{partner.name}</CardTitle>
								<CardDescription>{partner.place}</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground text-pretty">{partner.note}</p>
							</CardContent>
						</Card>
					</li>
				))}
			</ul>
		</ConsoleShell>
	);
}
