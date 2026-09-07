import Image from "next/image";
import { Parallax } from "@/components/site/parallax";
import { Reveal } from "@/components/site/reveal";
import { RichText } from "@/components/site/rich-text";
import { isRichTextEmpty } from "@/domain/rich-text";
import { SiteTheme } from "@/generated/prisma/enums";

// Shared across every theme's milestone list: incremental stagger delay, capped so a long story
// doesn't push the last milestones' reveal far past the first.
function staggerDelay(index: number): number {
	return Math.min(index * 80, 400);
}

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
	if (milestones.length === 0 && isRichTextEmpty(intro)) {
		return null;
	}

	return (
		<section
			id="story"
			className="mx-auto flex max-w-4xl scroll-mt-[var(--wed-nav-height)] flex-col gap-16 px-6 py-24"
		>
			<Reveal className="flex flex-col gap-4 text-center">
				<h2 className="text-4xl font-medium sm:text-5xl">{heading}</h2>
				<RichText html={intro} className="mx-auto max-w-2xl text-ink/70" />
			</Reveal>
			{theme === SiteTheme.MODERN && <ModernMilestones milestones={milestones} />}
			{theme === SiteTheme.GARDEN && <GardenMilestones milestones={milestones} />}
			{theme === SiteTheme.EDITORIAL && <EditorialMilestones milestones={milestones} />}
			{theme === SiteTheme.MIDNIGHT && <MidnightMilestones milestones={milestones} />}
			{theme === SiteTheme.BOHO && <BohoMilestones milestones={milestones} />}
			{theme === SiteTheme.VINTAGE && <VintageMilestones milestones={milestones} />}
		</section>
	);
}

function EditorialMilestones({ milestones }: { milestones: StoryMilestoneView[] }) {
	return (
		<div className="flex flex-col gap-16">
			{milestones.map((milestone, index) => (
				<Reveal
					key={milestone.id}
					delay={staggerDelay(index)}
					className={`flex flex-col items-center gap-8 md:flex-row ${
						index % 2 === 1 ? "md:flex-row-reverse" : ""
					}`}
				>
					{milestone.imageUrl && (
						<Parallax factor={0.12} className="aspect-[4/3] w-full rounded-xl md:w-1/2">
							<Image
								src={milestone.imageUrl}
								alt=""
								fill
								sizes="(min-width: 768px) 50vw, 100vw"
								className="reveal-photo-frame object-cover"
							/>
						</Parallax>
					)}
					<div
						className={`flex w-full flex-col gap-2 ${milestone.imageUrl ? "md:w-1/2" : "md:text-center"}`}
					>
						<span className="text-xs font-medium uppercase tracking-widest text-green">
							{milestone.dateLabel}
						</span>
						<h3 className="text-2xl">{milestone.title}</h3>
						<RichText html={milestone.body} className="text-ink/70" />
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
				<Reveal
					key={milestone.id}
					delay={staggerDelay(index)}
					className="flex gap-6 border-l border-ink/15 pl-6"
				>
					<span className="font-accent pt-1 text-sm text-ink/40">
						{String(index + 1).padStart(2, "0")}
					</span>
					{milestone.imageUrl && (
						<div className="h-20 w-20 shrink-0 overflow-hidden bg-ivory-dark">
							<Image
								src={milestone.imageUrl}
								alt=""
								width={160}
								height={160}
								className="reveal-photo-frame h-full w-full object-cover"
							/>
						</div>
					)}
					<div className="flex flex-col gap-1">
						<span className="text-xs uppercase tracking-widest text-green">
							{milestone.dateLabel}
						</span>
						<h3 className="text-xl">{milestone.title}</h3>
						<RichText html={milestone.body} className="text-ink/70" />
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
					delay={staggerDelay(index)}
					// No tilt below `sm` so a single narrow column of cards doesn't visually
					// collide; the polaroid tilt only kicks in once there's room to breathe.
					className={`w-64 bg-white p-3 pb-6 shadow-md ${index % 2 === 0 ? "sm:rotate-1" : "sm:-rotate-1"}`}
				>
					{milestone.imageUrl && (
						<Parallax factor={0.12} className="aspect-square w-full">
							<Image
								src={milestone.imageUrl}
								alt=""
								fill
								sizes="16rem"
								className="reveal-photo-frame object-cover"
							/>
						</Parallax>
					)}
					<p className="mt-3 text-center text-xs uppercase tracking-widest text-green">
						{milestone.dateLabel}
					</p>
					<h3 className="text-center text-lg">{milestone.title}</h3>
					<RichText html={milestone.body} className="text-center text-sm text-ink/70 italic" />
				</Reveal>
			))}
		</div>
	);
}

function MidnightMilestones({ milestones }: { milestones: StoryMilestoneView[] }) {
	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-10">
			{milestones.map((milestone, index) =>
				milestone.imageUrl ? (
					<Reveal
						key={milestone.id}
						delay={staggerDelay(index)}
						className="relative aspect-[16/10] w-full overflow-hidden rounded-xl"
					>
						<Parallax factor={0.12} className="absolute inset-0">
							<Image
								src={milestone.imageUrl}
								alt=""
								fill
								sizes="(min-width: 768px) 42rem, 100vw"
								className="reveal-photo-frame object-cover"
							/>
						</Parallax>
						<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
						{/* `max-w-*` keeps caption lines readable on a 360px-wide image instead of
						    running edge-to-edge. */}
						<div className="absolute inset-x-0 bottom-0 flex max-w-sm flex-col gap-1 px-5 pb-5 text-ivory">
							<span className="text-xs font-medium uppercase tracking-widest text-green">
								{milestone.dateLabel}
							</span>
							<h3 className="text-2xl">{milestone.title}</h3>
							<RichText html={milestone.body} className="text-ivory/80" />
						</div>
					</Reveal>
				) : (
					// Without a photo there is no image to overlay, so the caption becomes the card
					// itself rather than floating at the bottom of an empty 16:10 box.
					<Reveal
						key={milestone.id}
						delay={staggerDelay(index)}
						className="flex flex-col gap-1 rounded-xl border border-green/25 px-5 py-6"
					>
						<span className="text-xs font-medium uppercase tracking-widest text-green">
							{milestone.dateLabel}
						</span>
						<h3 className="text-2xl">{milestone.title}</h3>
						<RichText html={milestone.body} className="text-ink/70" />
					</Reveal>
				)
			)}
		</div>
	);
}

function BohoMilestones({ milestones }: { milestones: StoryMilestoneView[] }) {
	const blockClassNames = ["bg-ivory-dark", "bg-green/15", "bg-green-dark/15"];

	return (
		<div className="flex flex-col gap-6">
			{milestones.map((milestone, index) => (
				<Reveal
					key={milestone.id}
					delay={staggerDelay(index)}
					className={`flex flex-col items-center gap-6 rounded-3xl p-6 sm:flex-row ${
						blockClassNames[index % blockClassNames.length]
					}`}
				>
					<span className="font-accent shrink-0 text-6xl leading-none text-green/50">
						{String(index + 1).padStart(2, "0")}
					</span>
					{milestone.imageUrl && (
						<Parallax factor={0.12} className="aspect-square w-full shrink-0 rounded-2xl sm:w-40">
							<Image
								src={milestone.imageUrl}
								alt=""
								fill
								sizes="(min-width: 640px) 10rem, 100vw"
								className="reveal-photo-frame object-cover"
							/>
						</Parallax>
					)}
					<div className="flex flex-col gap-1 text-center sm:text-left">
						<span className="text-xs font-medium uppercase tracking-widest text-green">
							{milestone.dateLabel}
						</span>
						<h3 className="text-xl">{milestone.title}</h3>
						<RichText html={milestone.body} className="text-ink/70" />
					</div>
				</Reveal>
			))}
		</div>
	);
}

// A small corner flourish reused (rotated per corner) on VINTAGE's pressed-flower cards below.
function CornerOrnament({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeWidth="1.25"
		>
			<path d="M2 2c6 0 10 4 10 10M2 2c0 6 4 10 10 10M2 2c4 4 4 8 2 12" strokeLinecap="round" />
		</svg>
	);
}

function VintageMilestones({ milestones }: { milestones: StoryMilestoneView[] }) {
	return (
		<div className="flex flex-wrap justify-center gap-8">
			{milestones.map((milestone, index) => (
				<Reveal
					key={milestone.id}
					delay={staggerDelay(index)}
					className="relative w-64 border border-ink/15 bg-ivory p-4 pb-6 shadow-sm"
				>
					<CornerOrnament className="absolute top-1 left-1 h-5 w-5 text-green/50" />
					<CornerOrnament className="absolute top-1 right-1 h-5 w-5 rotate-90 text-green/50" />
					<CornerOrnament className="absolute bottom-1 left-1 h-5 w-5 -rotate-90 text-green/50" />
					<CornerOrnament className="absolute right-1 bottom-1 h-5 w-5 rotate-180 text-green/50" />
					{milestone.imageUrl && (
						<Parallax factor={0.12} className="aspect-square w-full">
							<Image
								src={milestone.imageUrl}
								alt=""
								fill
								sizes="16rem"
								className="reveal-photo-frame object-cover"
							/>
						</Parallax>
					)}
					<p className="mt-3 text-center text-xs uppercase tracking-widest text-green-dark">
						{milestone.dateLabel}
					</p>
					<h3 className="text-center text-lg">{milestone.title}</h3>
					<RichText html={milestone.body} className="text-center text-sm text-ink/70" />
				</Reveal>
			))}
		</div>
	);
}
