import { getDictionary } from "@/i18n";
import { localeCodes, locales } from "@/i18n/locales";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
	const settings = await db.settings.findUnique({ where: { id: 1 } });
	const coupleNames = settings?.coupleNames ?? "";

	return (
		<main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
			<h1 className="text-4xl font-medium sm:text-5xl">{coupleNames}</h1>
			<div className="flex flex-col gap-3 text-ink/70">
				{localeCodes.map((code) => (
					<p key={code} lang={code} dir={locales[code].dir}>
						{getDictionary(code).landing.tagline}
					</p>
				))}
			</div>
		</main>
	);
}
