import { z } from "zod";
import { resolveDatabaseUrl } from "@/lib/database-url";

const envSchema = z.object({
	DATABASE_URL: z.string().min(1),
	ADMIN_PASSWORD: z.string().min(1),
	ADMIN_SESSION_SECRET: z.string().min(1),
	APP_URL: z.string().min(1),
	EMAIL_FROM: z.string().min(1),
	RESEND_API_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

let parsed: Env | undefined;

function load(): Env {
	parsed ??= envSchema.parse({ ...process.env, DATABASE_URL: resolveDatabaseUrl(process.env) });
	return parsed;
}

// Parsed on first access so `next build` succeeds without runtime secrets.
export const env: Env = new Proxy({} as Env, {
	get(_target, key) {
		return load()[key as keyof Env];
	},
});
