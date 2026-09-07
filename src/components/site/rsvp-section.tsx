import { Reveal } from "@/components/site/reveal";
import { RichText } from "@/components/site/rich-text";
import type { Locale } from "@/generated/prisma/enums";
import { t } from "@/i18n";
import { formatDate } from "@/lib/format";

export function RsvpSection({
	anchor,
	heading,
	note,
	deadline,
	replyTo,
	locale,
	deadlineTemplate,
	questionsTemplate,
}: {
	anchor: string;
	heading: string;
	note: string;
	deadline: Date;
	replyTo: string | null;
	locale: Locale;
	deadlineTemplate: string;
	questionsTemplate: string;
}) {
	return (
		<section
			id={anchor || undefined}
			className="mx-auto flex max-w-2xl scroll-mt-[var(--wed-nav-height)] flex-col gap-4 px-6 py-24 text-center"
		>
			<Reveal className="flex flex-col gap-4">
				<h2 className="text-4xl font-medium sm:text-5xl">{heading}</h2>
				<RichText html={note} className="text-ink/70" />
				<p className="text-sm text-ink/60">
					{t(deadlineTemplate, { date: formatDate(deadline, locale) })}
				</p>
				{replyTo && (
					<p className="text-sm text-ink/60">{t(questionsTemplate, { email: replyTo })}</p>
				)}
			</Reveal>
		</section>
	);
}
