import { describe, expect, it } from "vitest";
import { resolveDatabaseUrl } from "@/lib/database-url";

describe("resolveDatabaseUrl", () => {
	it("prefers DATABASE_URL when it is a direct connection string", () => {
		expect(
			resolveDatabaseUrl({
				DATABASE_URL: "postgresql://a",
				rsvpwedday_POSTGRES_URL: "postgres://b",
			})
		).toBe("postgresql://a");
	});

	it("skips an empty DATABASE_URL and falls back to a prefixed variable", () => {
		expect(
			resolveDatabaseUrl({
				DATABASE_URL: "",
				rsvpwedday_PRISMA_DATABASE_URL: "prisma+postgres://accelerate",
				rsvpwedday_POSTGRES_URL: "postgres://direct",
			})
		).toBe("postgres://direct");
	});

	it("ignores accelerate urls because the pg adapter needs a direct connection", () => {
		expect(resolveDatabaseUrl({ DATABASE_URL: "prisma+postgres://accelerate" })).toBeUndefined();
	});

	it("returns undefined when nothing is configured", () => {
		expect(resolveDatabaseUrl({ NODE_ENV: "production" })).toBeUndefined();
	});
});
