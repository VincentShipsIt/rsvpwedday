import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { WEBSITE_SECTIONS } from "@/app/admin/website/sections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WebsiteIndexPage() {
	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-medium">Website</h1>
			<div className="grid gap-4 sm:grid-cols-2">
				{WEBSITE_SECTIONS.map((section) => (
					<Link key={section.href} href={section.href}>
						<Card className="transition-colors hover:bg-accent">
							<CardHeader>
								<CardTitle className="flex items-center justify-between text-base">
									{section.label}
									<ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
								</CardTitle>
							</CardHeader>
							<CardContent className="text-sm text-muted-foreground">
								{section.description}
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
