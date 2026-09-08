import { z } from "zod";
import { MAX_CHILDREN_UNDER_12 } from "@/domain/children";
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
		id: z.string().min(1).optional(),
		firstName: z.string().trim().min(1).max(100),
		lastName: z.string().trim().min(1).max(100),
		kind: z.literal(GuestKind.ADULT).default(GuestKind.ADULT),
		attendance: z.array(guestAttendanceSchema).max(100).optional(),
		email: z.email().optional(),
		phone: z.string().min(3).max(30).optional(),
	})
	.refine((companion) => Boolean(companion.email) || Boolean(companion.phone), {
		message: "Provide an email or a phone number",
		path: ["email"],
	});

export function createRsvpSubmissionSchema(companionAllowance: number) {
	return z
		.object({
			guests: z.array(guestResponseSchema).max(100),
			companions: z.array(companionSchema).max(companionAllowance),
			childrenUnder12: z.number().int().min(0).max(MAX_CHILDREN_UNDER_12).default(0),
			childrenDietary: z.string().trim().max(500).default(""),
			childAttendance: z
				.array(
					z.object({
						eventId: z.string().min(1),
						count: z.number().int().min(0).max(MAX_CHILDREN_UNDER_12),
					})
				)
				.max(100)
				.default([]),
			note: z.string().max(2000).optional().default(""),
			songRequest: z.string().max(500).optional().default(""),
		})
		.refine((value) => value.guests.length > 0 || value.childrenUnder12 > 0, {
			message: "At least one guest is required",
		})
		.refine((value) => value.childAttendance.every((row) => row.count <= value.childrenUnder12), {
			message: "Child attendance exceeds the household count",
		});
}

export type RsvpSubmission = z.infer<ReturnType<typeof createRsvpSubmissionSchema>>;
