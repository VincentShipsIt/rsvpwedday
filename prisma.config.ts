import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";
import { resolveDatabaseUrl } from "./src/lib/database-url";

export default defineConfig({
	schema: path.join(import.meta.dirname, "prisma", "schema.prisma"),
	datasource: {
		url: resolveDatabaseUrl(process.env) ?? "",
	},
	migrations: {
		seed: "bun run prisma/seed.ts",
	},
});
