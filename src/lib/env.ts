import { z } from "zod";

const optionalSecret = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().trim().url(),
  APP_AUTH_TOKEN: optionalSecret,
  LINKEDIN_CLIENT_ID: optionalSecret,
  LINKEDIN_CLIENT_SECRET: optionalSecret,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function validateServerEnv(input: Record<string, string | undefined> = process.env) {
  return serverEnvSchema.safeParse(input);
}

export function getServerEnv(): ServerEnv {
  const result = validateServerEnv();
  if (!result.success) {
    const names = result.error.issues.map((issue) => issue.path.join(".") || "environment");
    throw new Error(`Invalid server environment: ${names.join(", ")}`);
  }
  return result.data;
}
