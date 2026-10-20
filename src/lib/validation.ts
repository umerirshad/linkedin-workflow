import { z } from "zod";

export function normalizeProfileUrl(value: string): string {
  const url = new URL(value.trim());

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Profile URL must use HTTP or HTTPS");
  }

  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";

  return url.toString();
}

const normalizedProfileUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), {
    message: "Profile URL must use HTTP or HTTPS",
  })
  .transform(normalizeProfileUrl);

export const profileInputSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  headline: z.string().trim().max(240).optional(),
  company: z.string().trim().max(160).optional(),
  profileUrl: normalizedProfileUrlSchema.optional(),
  email: z.string().email().optional(),
  notes: z.string().trim().max(2_000).optional(),
});

export const listInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
});

export const pictureStatusSchema = z.enum(["PRESENT", "MISSING", "UNKNOWN"]);
export const profileNotesFilterSchema = z.enum(["any", "present", "missing"]).default("any");

export const profileQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(160).default(""),
  pictureStatus: pictureStatusSchema.optional(),
  notes: profileNotesFilterSchema,
  listId: z.string().trim().max(64).optional(),
});

export const profileUpdateSchema = z.object({
  notes: z.string().trim().max(2_000).nullable().optional(),
  pictureStatus: pictureStatusSchema.optional(),
}).strict();

export const membershipActionSchema = z.object({
  profileIds: z.array(z.string().trim().min(1).max(64)).min(1).max(1_000),
}).strict();

export type ProfileInput = z.infer<typeof profileInputSchema>;
export type ListInput = z.infer<typeof listInputSchema>;
