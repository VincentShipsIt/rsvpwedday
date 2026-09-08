import { CardsBlock } from "@/components/site/blocks/cards-block";
import { ImageBlock } from "@/components/site/blocks/image-block";
import { PageLinkBlock } from "@/components/site/blocks/page-link-block";
import { TextBlock } from "@/components/site/blocks/text-block";
import { Events, type EventView } from "@/components/site/events";
import { Faq } from "@/components/site/faq";
import { Gallery } from "@/components/site/gallery";
import { Gifts } from "@/components/site/gifts";
import { Hero } from "@/components/site/hero";
import { RsvpSection } from "@/components/site/rsvp-section";
import { SectionDivider } from "@/components/site/section-divider";
import { Story, type StoryMilestoneView } from "@/components/site/story";
import type { GiftView } from "@/domain/gifts";
import { BlockType, type Locale, type SiteTheme } from "@/generated/prisma/enums";
import type { Dictionary } from "@/i18n";
import { type BlockView, blockHeading } from "@/lib/page-content";

// Everything the built-in blocks need that does not live on the block itself.
export type BlockContext = {
	coupleNames: string;
	locale: Locale;
	dictionary: Dictionary;
	theme: SiteTheme;
	events: EventView[];
	milestones: StoryMilestoneView[];
	gifts: GiftView[];
	settings: { rsvpDeadline: Date; replyTo: string | null } | null;
	/** What the countdown counts to: the couple's wedding date, or the earliest event until set. */
	weddingDate: Date | null;
};

// Renders one page's blocks in order, with the theme's divider between them. Every block type is
// handled here and nowhere else, so adding a type is: a `BlockType` value, a definition in
// `src/domain/blocks.ts`, an editor case, and a case below.
export function PageBlocks({ blocks, context }: { blocks: BlockView[]; context: BlockContext }) {
	return (
		<>
			{blocks.map((block, index) => (
				<div key={block.id}>
					{index > 0 && <SectionDivider theme={context.theme} />}
					<BlockContent block={block} context={context} isFirst={index === 0} />
				</div>
			))}
		</>
	);
}

function BlockContent({
	block,
	context,
	isFirst,
}: {
	block: BlockView;
	context: BlockContext;
	isFirst: boolean;
}) {
	const {
		coupleNames,
		locale,
		dictionary,
		theme,
		events,
		milestones,
		gifts,
		settings,
		weddingDate,
	} = context;
	const heading = blockHeading(block, dictionary);

	switch (block.type) {
		case BlockType.HERO:
			return (
				<Hero
					coupleNames={coupleNames}
					heroImageUrl={block.imageUrl}
					tagline={block.title}
					countdownTarget={weddingDate}
					locale={locale}
					dictionary={dictionary}
					theme={theme}
				/>
			);
		case BlockType.STORY:
			return (
				<Story
					anchor={block.anchor}
					heading={heading}
					intro={block.body}
					milestones={milestones}
					theme={theme}
				/>
			);
		case BlockType.EVENTS:
			return (
				<Events
					anchor={block.anchor}
					heading={heading}
					events={events}
					locale={locale}
					dictionary={dictionary}
					theme={theme}
				/>
			);
		case BlockType.GALLERY:
			return (
				<Gallery
					anchor={block.anchor}
					heading={heading}
					imageUrls={block.imageUrls}
					theme={theme}
				/>
			);
		case BlockType.FAQ:
			return (
				<Faq
					anchor={block.anchor}
					heading={heading}
					entries={block.items.map((item) => ({
						id: item.id,
						question: item.title,
						answer: item.body,
					}))}
				/>
			);
		case BlockType.RSVP:
			return settings ? (
				<RsvpSection
					anchor={block.anchor}
					heading={heading}
					note={block.body}
					deadline={settings.rsvpDeadline}
					replyTo={settings.replyTo}
					locale={locale}
					deadlineTemplate={dictionary.site.rsvpDeadlineLabel}
					questionsTemplate={dictionary.site.rsvpQuestions}
				/>
			) : null;
		case BlockType.GIFTS:
			return (
				<Gifts
					anchor={block.anchor}
					heading={heading}
					intro={block.body}
					gifts={gifts}
					copy={dictionary.gifts}
				/>
			);
		case BlockType.TEXT:
			return <TextBlock anchor={block.anchor} heading={heading} body={block.body} />;
		case BlockType.CARDS:
			return (
				<CardsBlock
					anchor={block.anchor}
					heading={heading}
					body={block.body}
					imageUrl={block.imageUrl}
					items={block.items}
					linkLabel={dictionary.site.cardLinkLabel}
					isFirst={isFirst}
				/>
			);
		case BlockType.IMAGE:
			return block.imageUrl ? (
				<ImageBlock imageUrl={block.imageUrl} caption={block.title} isFirst={isFirst} />
			) : null;
		case BlockType.PAGE_LINK:
			return block.url ? (
				<PageLinkBlock
					href={block.url}
					title={block.title}
					body={block.body}
					imageUrl={block.imageUrl}
					ctaLabel={dictionary.site.pageLinkCta}
				/>
			) : null;
	}
}
