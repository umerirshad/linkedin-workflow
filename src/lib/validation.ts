import { z } from "zod";

export const profileInputSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  headline: z.string().trim().max(240).optional(),
  company: z.string().trim().max(160).optional(),
  profileUrl: z.string().url().optional(),
  email: z.string().email().optional(),
  notes: z.string().trim().max(2_000).optional(),
});

export const listInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
export type ListInput = z.infer<typeof listInputSchema>;
