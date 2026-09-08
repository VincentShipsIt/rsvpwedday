import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { BlockState } from "@/app/admin/pages/[id]/block-types";
import { PageEditor } from "@/app/admin/pages/[id]/page-editor";
import { Button } from "@/components/ui/button";
import { isHomePage, pagePath } from "@/domain/blocks";
import type { Locale } from "@/generated/prisma/enums";
import { getDictionary } from "@/i18n";
import { localeCodes } from "@/i18n/locales";
import { isBlobConfigured } from "@/lib/blob";
import { db } from "@/lib/db";
import { localizePage, pageInclude, pageLabel } from "@/lib/page-content";
import { isImageGenerationConfigured } from "@/lib/replicate";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

// Fills in a row for every locale, so the editor's language switcher always has something to
// write into even for a translation that was never saved.
function withEveryLocale<T extends { locale: Locale }>(
	rows: T[],
	blank: (locale: Locale) => T
): T[] {
	return localeCodes.map((locale) => rows.find((row) => row.locale === locale) ?? blank(locale));
}

export default async function AdminPageEditorPage({ params }: { params: Promise<{ id: string }> }) {
	await requireAdmin();
	const { id } = await params;
	const [record, allPages] = await Promise.all([
		db.page.findUnique({ where: { id }, include: pageInclude }),
		db.page.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
	]);

	if (!record) {
		notFound();
	}

	const dictionary = getDictionary(localeCodes[0]);
	const label = pageLabel(localizePage(record, localeCodes[0]), dictionary);

	const blocks: BlockState[] = record.blocks.map((block) => ({
		id: block.id,
		type: block.type,
		anchor: block.anchor,
		imageUrl: block.imageUrl ?? "",
		imageUrls: block.imageUrls,
		url: block.url ?? "",
		translations: withEveryLocale(
			block.translations.map((translation) => ({
				locale: translation.locale,
				title: translation.title,
				body: translation.body,
			})),
			(locale) => ({ locale, title: "", body: "" })
		),
		items: block.items.map((item) => ({
			id: item.id,
			key: item.id,
			url: item.url ?? "",
			imageUrl: item.imageUrl ?? "",
			translations: withEveryLocale(
				item.translations.map((translation) => ({
					locale: translation.locale,
					title: translation.title,
					body: translation.body,
				})),
				(locale) => ({ locale, title: "", body: "" })
			),
		})),
	}));

	// Every page a teaser block can point at, including the home page.
	const pageOptions = allPages.map((page) => ({
		id: page.id,
		slug: page.slug,
		path: pagePath(page.slug),
		label: pageLabel(
			{
				slug: page.slug,
				title:
					page.translations.find((translation) => translation.locale === localeCodes[0])?.title ??
					"",
			},
			dictionary
		),
	}));

	return (
		<div className="flex flex-col gap-6">
			<Button variant="link" className="h-auto w-fit p-0" asChild>
				<Link href="/admin/pages">
					<ChevronLeftIcon />
					Pages
				</Link>
			</Button>
			<h1 className="text-2xl font-medium">{isHomePage(record) ? "Home page" : label}</h1>
			<PageEditor
				page={{
					id: record.id,
					slug: record.slug,
					isHome: isHomePage(record),
					showInNav: record.showInNav,
					path: pagePath(record.slug),
					translations: withEveryLocale(
						record.translations.map((translation) => ({
							locale: translation.locale,
							title: translation.title,
							intro: translation.intro,
						})),
						(locale) => ({ locale, title: "", intro: "" })
					),
				}}
				blocks={blocks}
				pageOptions={pageOptions}
				blobConfigured={isBlobConfigured()}
				aiConfigured={isImageGenerationConfigured()}
			/>
		</div>
	);
}
