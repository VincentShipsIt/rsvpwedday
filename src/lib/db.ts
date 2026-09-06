import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

const globalForDb = globalThis as unknown as { __db?: PrismaClient };

function client(): PrismaClient {
	globalForDb.__db ??= new PrismaClient({
		adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
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
