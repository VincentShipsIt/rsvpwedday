import { PrismaPg } from "@prisma/adapter-pg";
import { isSoftDeletedModel } from "@/domain/soft-delete";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

const globalForDb = globalThis as unknown as {
	__db?: PrismaClient;
	__dbWithDeleted?: PrismaClient;
};

/*
 * Reads that a tombstone must not appear in. Writes are left alone: an `update` that sets
 * `deletedAt` is exactly how a delete happens, and `upsert`/`create` need to see a tombstoned row
 * to fail loudly rather than silently duplicating it.
 */
const FILTERED_READS = new Set([
	"findFirst",
	"findFirstOrThrow",
	"findMany",
	"findUnique",
	"findUniqueOrThrow",
	"count",
	"aggregate",
	"groupBy",
]);

function client(): PrismaClient {
	// Prisma Postgres caps direct TCP connections per role, and every warm serverless instance
	// keeps its own pool; pg's default of 10 per pool exhausted that cap under a handful of
	// concurrent instances (plus a build's `db push`), so each instance keeps at most 2 and
	// drops idle ones quickly.
	globalForDb.__db ??= new PrismaClient({
		adapter: new PrismaPg({
			connectionString: env.DATABASE_URL,
			max: 2,
			idleTimeoutMillis: 5_000,
			connectionTimeoutMillis: 10_000,
		}),
	});
	return globalForDb.__db;
}

/*
 * Hides soft-deleted rows from every top-level read, in one place. Doing it per query would mean
 * remembering `deletedAt: null` at some fifty call sites, and the one that was forgotten would
 * quietly show a deleted event to guests.
 *
 * It does not reach inside `include`, which is a limitation of Prisma extensions rather than a
 * choice: a nested relation carries its own `where`, so those are filtered explicitly where they
 * are declared (`pageInclude`, the guest lists on an invitation). Grep for `deletedAt: null` to
 * find them.
 */
function withSoftDeleteFilter(base: PrismaClient): PrismaClient {
	return base.$extends({
		query: {
			$allModels: {
				$allOperations({ model, operation, args, query }) {
					if (!isSoftDeletedModel(model) || !FILTERED_READS.has(operation)) {
						return query(args);
					}
					const typed = args as { where?: Record<string, unknown> };
					return query({
						...args,
						where: { ...typed.where, deletedAt: null },
					});
				},
			},
		},
	}) as unknown as PrismaClient;
}

function filteredClient(): PrismaClient {
	globalForDb.__dbWithDeleted ??= withSoftDeleteFilter(client());
	return globalForDb.__dbWithDeleted;
}

function lazy(resolve: () => PrismaClient): PrismaClient {
	// Created on first query so importing this module never touches the environment.
	return new Proxy({} as PrismaClient, {
		get(_target, key) {
			const instance = resolve();
			const value = Reflect.get(instance, key);
			return typeof value === "function" ? value.bind(instance) : value;
		},
	});
}

/** The client everything should use: soft-deleted rows do not exist as far as it is concerned. */
export const db: PrismaClient = lazy(filteredClient);

/*
 * The unfiltered client, for the two jobs that must see tombstones: restoring something, and
 * whatever eventually purges. Never use it to render a page — that is how a deleted row reaches a
 * guest.
 */
export const dbIncludingDeleted: PrismaClient = lazy(client);
