import Image from "next/image";
import { Reveal } from "@/components/site/reveal";
import { SiteTheme } from "@/generated/prisma/enums";

export type StoryMilestoneView = {
	id: string;
	dateLabel: string;
	imageUrl: string | null;
	title: string;
	body: string;
};

export function Story({
	heading,
	intro,
	milestones,
	theme,
}: {
	heading: string;
	intro: string;
	milestones: StoryMilestoneView[];
	theme: SiteTheme;
}) {
	if (milestones.length === 0 && !intro) {
		return null;
	}

	return (
		<section
			id="story"
			className="mx-auto flex max-w-4xl scroll-mt-[var(--wed-nav-height)] flex-col gap-16 px-6 py-24"
		>
			<Reveal className="flex flex-col gap-4 text-center">
				<h2 className="text-4xl font-medium sm:text-5xl">{heading}</h2>
				{intro && <p className="mx-auto max-w-2xl text-ink/70">{intro}</p>}
			</Reveal>
			{theme === SiteTheme.MODERN && <ModernMilestones milestones={milestones} />}
			{theme === SiteTheme.GARDEN && <GardenMilestones milestones={milestones} />}
			{theme === SiteTheme.EDITORIAL && <EditorialMilestones milestones={milestones} />}
		</section>
	);
}

function EditorialMilestones({ milestones }: { milestones: StoryMilestoneView[] }) {
	return (
		<div className="flex flex-col gap-16">
			{milestones.map((milestone, index) => (
				<Reveal
					key={milestone.id}
					className={`flex flex-col items-center gap-8 md:flex-row ${
						index % 2 === 1 ? "md:flex-row-reverse" : ""
					}`}
				>
					<div className="aspect-[4/3] w-full overflow-hidden rounded-xl md:w-1/2">
						{milestone.imageUrl ? (
							<Image
								src={milestone.imageUrl}
								alt=""
								width={640}
								height={480}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="h-full w-full bg-gradient-to-br from-ivory-dark to-green/20" />
						)}
					</div>
					<div className="flex w-full flex-col gap-2 md:w-1/2">
						<span className="text-xs font-medium uppercase tracking-widest text-green">
							{milestone.dateLabel}
						</span>
						<h3 className="text-2xl">{milestone.title}</h3>
						<p className="text-ink/70">{milestone.body}</p>
					</div>
				</Reveal>
			))}
		</div>
	);
}

function ModernMilestones({ milestones }: { milestones: StoryMilestoneView[] }) {
	return (
		<div className="flex flex-col gap-10">
			{milestones.map((milestone, index) => (
				<Reveal key={milestone.id} className="flex gap-6 border-l border-ink/15 pl-6">
					<span className="font-accent pt-1 text-sm text-ink/40">
						{String(index + 1).padStart(2, "0")}
					</span>
					<div className="h-20 w-20 shrink-0 overflow-hidden bg-ivory-dark">
						{milestone.imageUrl && (
							<Image
								src={milestone.imageUrl}
								alt=""
								width={160}
								height={160}
								className="h-full w-full object-cover"
							/>
						)}
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs uppercase tracking-widest text-green">
							{milestone.dateLabel}
						</span>
						<h3 className="text-xl">{milestone.title}</h3>
						<p className="text-ink/70">{milestone.body}</p>
					</div>
				</Reveal>
			))}
		</div>
	);
}

function GardenMilestones({ milestones }: { milestones: StoryMilestoneView[] }) {
	return (
		<div className="flex flex-wrap justify-center gap-10">
			{milestones.map((milestone, index) => (
				<Reveal
					key={milestone.id}
					className={`w-64 bg-white p-3 pb-6 shadow-md ${index % 2 === 0 ? "rotate-1" : "-rotate-1"}`}
				>
					<div className="aspect-square w-full overflow-hidden">
						{milestone.imageUrl ? (
							<Image
								src={milestone.imageUrl}
								alt=""
								width={320}
								height={320}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="h-full w-full bg-ivory-dark" />
						)}
					</div>
					<p className="mt-3 text-center text-xs uppercase tracking-widest text-green">
						{milestone.dateLabel}
					</p>
					<h3 className="text-center text-lg">{milestone.title}</h3>
					<p className="text-center text-sm text-ink/70 italic">{milestone.body}</p>
				</Reveal>
			))}
		</div>
	);
}
