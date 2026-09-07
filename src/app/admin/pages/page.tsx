import { type PageRow, PagesList } from "@/app/admin/pages/pages-list";
import { isHomePage, pagePath } from "@/domain/blocks";
import { getDictionary } from "@/i18n";
import { localeCodes } from "@/i18n/locales";
import { db } from "@/lib/db";
import { pageLabel } from "@/lib/page-content";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
	const pages = await db.page.findMany({
		orderBy: { sortOrder: "asc" },
		include: { translations: true, _count: { select: { blocks: true } } },
	});

	const dictionary = getDictionary(localeCodes[0]);
	const rows: PageRow[] = pages.map((page) => ({
		id: page.id,
		slug: page.slug,
		isHome: isHomePage(page),
		label: isHomePage(page)
			? "Home"
			: pageLabel(
					{
						slug: page.slug,
						title:
							page.translations.find((translation) => translation.locale === localeCodes[0])
								?.title ?? "",
					},
					dictionary
				),
		path: pagePath(page.slug),
		blockCount: page._count.blocks,
	}));

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-medium">Pages</h1>
				<p className="text-sm text-muted-foreground">
					Every page on the site, in the order their links appear in the footer. Open one to add,
					reorder or edit its blocks.
				</p>
			</div>
			<PagesList pages={rows} />
		</div>
	);
}
