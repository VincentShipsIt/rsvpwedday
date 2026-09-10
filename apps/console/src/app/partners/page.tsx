import { Badge } from "@rsvpwedday/ui/badge";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@rsvpwedday/ui/table";
import { ConsoleShell } from "@/components/console-shell";
import { categoryLabels, partners } from "@/lib/mock";

export default function PartnersPage() {
	return (
		<ConsoleShell active="/partners">
			<div className="flex flex-col gap-8">
				<div>
					<h1 className="text-2xl font-medium">Partners</h1>
					<p className="text-muted-foreground mt-1 max-w-2xl text-sm">
						Houses, kitchens, flowers, photographers we actually work with. Not a public directory.
						Booking onto a wedding comes after the tenant lands.
					</p>
				</div>
				<div className="rounded-xl bg-card ring-1 ring-foreground/10">
					<Table>
						<TableCaption className="sr-only">Internal partner roster by category</TableCaption>
						<TableHeader>
							<TableRow>
								<TableHead>Partner</TableHead>
								<TableHead>Category</TableHead>
								<TableHead>Place</TableHead>
								<TableHead>Note</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{partners.map((partner) => (
								<TableRow key={partner.id}>
									<TableCell className="font-medium">{partner.name}</TableCell>
									<TableCell>
										<Badge variant="secondary">{categoryLabels[partner.category]}</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground">{partner.place}</TableCell>
									<TableCell className="text-muted-foreground text-pretty whitespace-normal">
										{partner.note}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		</ConsoleShell>
	);
}
