import { spawnSync } from "node:child_process";
import { seedContent } from "../prisma/content-seed";
import { resolveDatabaseUrl } from "../src/lib/database-url";

const url = resolveDatabaseUrl(process.env);

if (!url) {
	console.info("No direct database url configured, schema push and content seed skipped.");
	process.exit(0);
}

const push = spawnSync("./node_modules/.bin/prisma", ["db", "push"], {
	stdio: "inherit",
	env: { ...process.env, DATABASE_URL: url },
});

if (push.status !== 0) {
	process.exit(push.status ?? 1);
}

// A deployment against an empty database would otherwise serve a nameless, event-less page until
// somebody opens the admin. `seedContent` is count-guarded, so this fills that gap once and is a
// no-op on every later deploy.
const events = await seedContent();
console.info(`Content seed complete, ${events.length} event(s) in the database.`);
