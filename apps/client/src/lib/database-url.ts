const DIRECT_URL_PREFIXES = ["postgres://", "postgresql://"];

function isDirectUrl(value: string | undefined): value is string {
	return value !== undefined && DIRECT_URL_PREFIXES.some((prefix) => value.startsWith(prefix));
}

// Vercel storage integrations inject their variables under a project prefix
// (for example `rsvpwedday_POSTGRES_URL`), so the plain names are tried first
// and any prefixed direct connection string is accepted after that.
export function resolveDatabaseUrl(source: Record<string, string | undefined>): string | undefined {
	const candidates = [
		source.DATABASE_URL,
		source.POSTGRES_URL,
		...Object.keys(source)
			.filter((key) => key.endsWith("_POSTGRES_URL"))
			.sort()
			.map((key) => source[key]),
		...Object.keys(source)
			.filter((key) => key.endsWith("_DATABASE_URL"))
			.sort()
			.map((key) => source[key]),
	];
	return candidates.find(isDirectUrl);
}
