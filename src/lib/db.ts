import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const globalForDb = globalThis as unknown as { __db?: PrismaClient };

export const db = globalForDb.__db ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
	globalForDb.__db = db;
}
