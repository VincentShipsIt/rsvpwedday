import { spawnSync } from "node:child_process";
import { resolveDatabaseUrl } from "../src/lib/database-url";

const url = resolveDatabaseUrl(process.env);

if (!url) {
	console.info("No direct database url configured, schema push skipped.");
	process.exit(0);
}

const result = spawnSync("./node_modules/.bin/prisma", ["db", "push"], {
	stdio: "inherit",
	env: { ...process.env, DATABASE_URL: url },
});

process.exit(result.status ?? 1);
