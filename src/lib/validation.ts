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

export type ProfileInput = z.infer<typeof profileInputSchema>;
export type ListInput = z.infer<typeof listInputSchema>;
