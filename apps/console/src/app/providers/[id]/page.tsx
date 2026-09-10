import { Badge } from "@rsvpwedday/ui/badge";
import { Button } from "@rsvpwedday/ui/button";
import { StarIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsoleShell } from "@/components/console-shell";
import { ContactLinks } from "@/components/contact-links";
import { PlaceMap } from "@/components/place-map";
import { ProviderDialog } from "@/components/provider-dialog";
import { providerKindLabels } from "@/lib/crm";
import { getProvider } from "@/lib/store";

/*
 * Read first, edit second — a listing rather than a form. Every block below is
 * conditional on the studio actually having that fact, so a half-filled
 * provider reads as a short page instead of a wall of empty inputs. Editing
 * moved into the same dialog the list uses, so there is one form, not two.
 */
export default async function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const provider = await getProvider(id);
	if (!provider) notFound();

	const facts = [
		{ label: "Kind", value: providerKindLabels[provider.kind] },
		{ label: "Place", value: provider.place.label },
		provider.capacity ? { label: "Capacity", value: provider.capacity } : null,
		provider.hours ? { label: "Hours", value: provider.hours } : null,
		provider.place.address ? { label: "Address", value: provider.place.address } : null,
	].filter((fact) => fact !== null);

	return (
		<ConsoleShell pathname="/providers">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="text-muted-foreground text-[12px]">
							<Link href="/providers" className="hover:underline">
								Providers
							</Link>
						</p>
						<h1 className="mt-1 text-3xl font-semibold tracking-tight">{provider.name}</h1>
						<p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 text-sm">
							<span>{providerKindLabels[provider.kind]}</span>
							<span aria-hidden="true">·</span>
							<span>{provider.place.label}</span>
							{provider.rating ? (
								<>
									<span aria-hidden="true">·</span>
									<span className="text-foreground inline-flex items-center gap-1 font-medium">
										<StarIcon className="size-3.5 fill-current" aria-hidden="true" />
										{provider.rating.toFixed(1)}
										{provider.reviewCount ? (
											<span className="text-muted-foreground font-normal">
												({provider.reviewCount})
											</span>
										) : null}
									</span>
								</>
							) : null}
						</p>
					</div>
					<ProviderDialog provider={provider} variant="outline" />
				</div>

				{provider.place.lat != null ? <PlaceMap place={provider.place} /> : null}

				<div className="grid gap-6 lg:grid-cols-3">
					<div className="flex flex-col gap-6 lg:col-span-2">
						{provider.notes ? (
							<section className="flex flex-col gap-2">
								<h2 className="text-[13px] font-semibold">About</h2>
								<p className="text-pretty">{provider.notes}</p>
							</section>
						) : null}

						<section className="flex flex-col gap-2">
							<h2 className="text-[13px] font-semibold">At a glance</h2>
							<dl className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
								{facts.map((fact) => (
									<div key={fact.label} className="bg-background px-3 py-2.5">
										<dt className="text-muted-foreground text-[12px]">{fact.label}</dt>
										<dd className="mt-0.5 text-[13px] text-pretty">{fact.value}</dd>
									</div>
								))}
							</dl>
						</section>

						{provider.tags.length > 0 ? (
							<section className="flex flex-col gap-2">
								<h2 className="text-[13px] font-semibold">Tags</h2>
								<ul className="flex flex-wrap gap-1.5">
									{provider.tags.map((tag) => (
										<li key={tag}>
											<Badge variant="outline" className="font-normal">
												{tag}
											</Badge>
										</li>
									))}
								</ul>
							</section>
						) : null}

						{provider.rating || provider.reviewsUrl ? (
							<section className="flex flex-col gap-2">
								<h2 className="text-[13px] font-semibold">Reviews</h2>
								<div className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-3">
									{provider.rating ? (
										<p className="flex items-center gap-1.5 text-[15px] font-semibold">
											<StarIcon className="size-4 fill-current" aria-hidden="true" />
											{provider.rating.toFixed(1)}
											{provider.reviewCount ? (
												<span className="text-muted-foreground text-[13px] font-normal">
													from {provider.reviewCount} reviews
												</span>
											) : null}
										</p>
									) : null}
									{provider.reviewsUrl ? (
										<Button asChild size="sm" variant="outline" className="ml-auto">
											<a href={provider.reviewsUrl} target="_blank" rel="noreferrer">
												Read them
											</a>
										</Button>
									) : null}
								</div>
							</section>
						) : null}
					</div>

					<aside className="lg:col-span-1">
						<div className="flex flex-col gap-3 rounded-lg border p-4 lg:sticky lg:top-4">
							<h2 className="text-[13px] font-semibold">Contact</h2>
							<ContactLinks contact={provider.contact} name={provider.name} />
							{provider.website ? (
								<Button asChild size="sm" variant="outline">
									<a href={provider.website} target="_blank" rel="noreferrer">
										Website
									</a>
								</Button>
							) : null}
							{provider.instagram ? (
								<Button asChild size="sm" variant="outline">
									<a
										href={`https://instagram.com/${provider.instagram.replace(/^@/, "")}`}
										target="_blank"
										rel="noreferrer"
									>
										Instagram
									</a>
								</Button>
							) : null}
						</div>
					</aside>
				</div>
			</div>
		</ConsoleShell>
	);
}
