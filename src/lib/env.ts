import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.string().min(1),
	ADMIN_PASSWORD: z.string().min(1),
	ADMIN_SESSION_SECRET: z.string().min(1),
	APP_URL: z.string().min(1),
	EMAIL_FROM: z.string().min(1),
	RESEND_API_KEY: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);
