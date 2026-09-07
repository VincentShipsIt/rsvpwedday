import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SECTIONS = [
	{ href: "/admin/website/hero", label: "Hero", description: "Hero photo and tagline" },
	{ href: "/admin/website/story", label: "Story", description: "Story intro and milestones" },
	{ href: "/admin/website/events", label: "Events", description: "Event schedule and venues" },
	{ href: "/admin/website/gallery", label: "Gallery", description: "Gallery photos" },
	{ href: "/admin/website/rsvp", label: "RSVP", description: "RSVP note shown to guests" },
	{ href: "/admin/website/theme", label: "Theme", description: "Site theme and previews" },
	{
		href: "/admin/website/effects",
		label: "Effects",
		description: "Opening animation, particles, and music",
	},
] as const;

export default function WebsiteIndexPage() {
	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-medium">Website</h1>
			<div className="grid gap-4 sm:grid-cols-2">
				{SECTIONS.map((section) => (
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
