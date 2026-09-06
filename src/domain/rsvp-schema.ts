import { z } from "zod";
import { GuestKind } from "@/generated/prisma/enums";

const guestAttendanceSchema = z.object({
	eventId: z.string().min(1),
	attending: z.boolean(),
});

const guestResponseSchema = z.object({
	guestId: z.string().min(1),
	dietary: z.string().max(500).optional().default(""),
	attendance: z.array(guestAttendanceSchema).min(1),
});

const companionSchema = z
	.object({
		firstName: z.string().min(1).max(100),
		lastName: z.string().min(1).max(100),
		kind: z.enum(GuestKind),
		email: z.email().optional(),
		phone: z.string().min(3).max(30).optional(),
	})
	.refine((companion) => Boolean(companion.email) || Boolean(companion.phone), {
		message: "Provide an email or a phone number",
		path: ["email"],
	});

export function createRsvpSubmissionSchema(companionAllowance: number) {
	return z.object({
		guests: z.array(guestResponseSchema).min(1),
		companions: z.array(companionSchema).max(companionAllowance),
		note: z.string().max(2000).optional().default(""),
		songRequest: z.string().max(500).optional().default(""),
	});
}

export type RsvpSubmission = z.infer<ReturnType<typeof createRsvpSubmissionSchema>>;
