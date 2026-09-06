import Image from "next/image";
import { Reveal } from "@/components/site/reveal";

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
}: {
	heading: string;
	intro: string;
	milestones: StoryMilestoneView[];
}) {
	if (milestones.length === 0 && !intro) {
		return null;
	}

	return (
		<section id="story" className="mx-auto flex max-w-4xl flex-col gap-16 px-6 py-24">
			<Reveal className="flex flex-col gap-4 text-center">
				<h2 className="text-4xl font-medium sm:text-5xl">{heading}</h2>
				{intro && <p className="mx-auto max-w-2xl text-ink/70">{intro}</p>}
			</Reveal>
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
		</section>
	);
}
