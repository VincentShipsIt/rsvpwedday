import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

const globalForDb = globalThis as unknown as { __db?: PrismaClient };

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

// Created on first query so importing this module never touches the environment.
export const db: PrismaClient = new Proxy({} as PrismaClient, {
	get(_target, key) {
		const instance = client();
		const value = Reflect.get(instance, key);
		return typeof value === "function" ? value.bind(instance) : value;
	},
});
