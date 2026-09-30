import { z } from "zod";
import { isDateKey } from "@/lib/time-off";

/** Zod schemas for leave payloads, shared by the forms and (later) the leave controller. */

const dateKey = (message: string) => z.string().refine(isDateKey, message);

export const leaveRequestSchema = z
  .object({
    typeId: z.string().min(1, "Choose a leave type"),
    startDate: dateKey("Pick a start date"),
    endDate: dateKey("Pick an end date"),
    halfDay: z.boolean(),
    reason: z.string().trim().max(500, "Keep it under 500 characters"),
  })
  .refine((v) => v.endDate >= v.startDate, { path: ["endDate"], message: "End date can't be before the start date" })
  .refine((v) => !v.halfDay || v.startDate === v.endDate, { path: ["halfDay"], message: "Half days are for single-day requests" });

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;

export const leaveReviewSchema = z.object({
  decision: z.enum(["Approved", "Rejected"]),
  note: z.string().trim().max(500, "Keep it under 500 characters"),
});

export type LeaveReviewInput = z.infer<typeof leaveReviewSchema>;

export const leaveTypeSchema = z.object({
  name: z.string().trim().min(2, "Name the leave type").max(40),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Pick a color"),
  /** `null` = no yearly limit. */
  allowance: z.number({ error: "Enter a number of days" }).min(0, "Can't be negative").max(365).multipleOf(0.5, "Use whole or half days").nullable(),
  paid: z.boolean(),
  requiresApproval: z.boolean(),
});

export type LeaveTypeInput = z.infer<typeof leaveTypeSchema>;

export const workingDaysSchema = z.array(z.number().int().min(0).max(6)).min(1, "Pick at least one working day");
