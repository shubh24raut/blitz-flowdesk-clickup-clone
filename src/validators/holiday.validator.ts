import { z } from "zod";
import { isDateKey } from "@/lib/time-off";

/** Zod schemas for holiday payloads, shared by the forms and (later) the holiday controller. */

export const holidaySchema = z.object({
  name: z.string().trim().min(2, "Name the holiday").max(80),
  date: z.string().refine(isDateKey, "Pick a date"),
  kind: z.enum(["public", "optional", "company"]),
  /** `null` = company-wide, applies to every member. */
  calendarId: z.string().nullable(),
});

export type HolidayInput = z.infer<typeof holidaySchema>;

export const importHolidaysSchema = z.object({
  countryCode: z.string().length(2, "Choose a country"),
  regionCode: z.string().nullable(),
  year: z.number().int().min(2000).max(2100),
});

export type ImportHolidaysInput = z.infer<typeof importHolidaysSchema>;
