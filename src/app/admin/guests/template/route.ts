import { serializeImportTemplateCsv } from "@/domain/csv";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// The import template, generated so its example rows use this site's real event slugs.
export async function GET() {
	const events = await db.event.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true } });
	const csv = serializeImportTemplateCsv(events.map((event) => event.slug));
	return new Response(csv, {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": 'attachment; filename="guests-template.csv"',
		},
	});
}
