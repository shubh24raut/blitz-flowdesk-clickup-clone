import { z } from "zod";
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "@/lib/organizations";

/** Zod schemas for workspace payloads, shared by the forms and (later) the organization controller. */

export const organizationSchema = z.object({
  name: z.string().trim().min(2, "Workspace name is required").max(60, "Keep it under 60 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Choose a workspace URL")
    .max(SLUG_MAX_LENGTH, `Keep it under ${SLUG_MAX_LENGTH} characters`)
    .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens"),
  website: z.union([z.literal(""), z.url("Enter a full URL, e.g. https://acme.com")]),
  logoUrl: z.string().optional(),
});

export type OrganizationFormInput = z.infer<typeof organizationSchema>;
