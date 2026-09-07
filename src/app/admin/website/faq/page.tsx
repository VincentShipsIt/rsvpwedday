import { FaqForm } from "@/app/admin/website/faq/faq-form";
import { WebsiteNav } from "@/app/admin/website/website-nav";
import { localeCodes } from "@/i18n/locales";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function FaqPage() {
	const entries = await db.faqEntry.findMany({
		orderBy: { sortOrder: "asc" },
		include: { translations: true },
	});

	return (
		<div className="flex flex-col gap-6">
			<WebsiteNav current="/admin/website/faq" />
			<h1 className="text-2xl font-medium">FAQ</h1>
			<p className="max-w-2xl text-sm text-muted-foreground">
				Shown on the home page just before the RSVP block: dress code, children, gifts, dietary
				needs. Leave it empty and the section and its nav link stay hidden.
			</p>
			<FaqForm
				initialEntries={entries.map((entry) => ({
					id: entry.id,
					sortOrder: entry.sortOrder,
					translations: localeCodes.map((code) => {
						const translation = entry.translations.find((candidate) => candidate.locale === code);
						return {
							locale: code,
							question: translation?.question ?? "",
							answer: translation?.answer ?? "",
						};
					}),
				}))}
			/>
		</div>
	);
}
