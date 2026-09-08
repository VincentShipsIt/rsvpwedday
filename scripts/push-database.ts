import "dotenv/config";
import { spawnSync } from "node:child_process";
import { Client } from "pg";
import { resolveDatabaseUrl } from "../src/lib/database-url";

export async function pushDatabase(url: string): Promise<void> {
	const client = new Client({ connectionString: url });
	await client.connect();
	try {
		await client.query("BEGIN");
		await client.query("SELECT pg_advisory_xact_lock(hashtext('rsvp-photo-receipt-upgrade'))");
		// Existing photos acquire a NULL receipt, never invented ownership. Creating its unique
		// index explicitly avoids Prisma's generic warning about duplicates in a brand-new column.
		// A partially upgraded database with actual duplicate receipts still fails safely here.
		await client.query(`DO $$ BEGIN
   IF to_regclass('"Photo"') IS NOT NULL THEN
    ALTER TABLE "Photo" ADD COLUMN IF NOT EXISTS "uploadReceiptId" TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS "Photo_uploadReceiptId_key" ON "Photo" ("uploadReceiptId");
   END IF;
  END $$`);
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		await client.end();
	}
	const push = spawnSync("./node_modules/.bin/prisma", ["db", "push"], {
		stdio: "inherit",
		env: { ...process.env, DATABASE_URL: url },
	});
	if (push.status !== 0) throw new Error(`Schema push failed (exit ${push.status ?? "unknown"}).`);
}

if (import.meta.main) {
	const url = resolveDatabaseUrl(process.env);
	if (!url) throw new Error("A direct database URL is required for schema push.");
	await pushDatabase(url);
}
