import { seedContent } from "../prisma/content-seed";
import { migrateToPages } from "../prisma/page-migration";
import { resolveDatabaseUrl } from "../src/lib/database-url";
import { pushDatabase } from "./push-database";

const url = resolveDatabaseUrl(process.env);

if (!url) {
	console.info("No direct database url configured, schema push and content seed skipped.");
	process.exit(0);
}

await pushDatabase(url);

// A deployment against an empty database would otherwise serve a nameless, event-less page until
// somebody opens the admin. `seedContent` records initialization transactionally, so this fills that gap once and is a
// no-op on every later deploy.
const events = await seedContent();
console.info(`Content seed complete, ${events.length} event(s) in the database.`);

// A separate durable marker, one level up: a site that predates pages gets its fixed sections copied into
// blocks once; a database that already has pages is left alone.
const pages = await migrateToPages();
console.info(`Page migration ${pages}.`);
