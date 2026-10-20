import { z } from "zod";
import { MAX_IMPORT_CONTENT_BYTES, MAX_IMPORT_ROWS, type ImportMode } from "../modules/profile-imports/import-service.ts";

const peopleSearchUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return /(^|\.)linkedin\.com$/i.test(url.hostname) && /^\/search\/results\/people\/?$/i.test(url.pathname);
  }, "Use a LinkedIn people-search URL only as source metadata");

export const importRequestSchema = z.object({
  listId: z.string().trim().min(1).max(64),
  mode: z.enum(["urls", "csv"]),
  content: z.string().min(1).max(MAX_IMPORT_CONTENT_BYTES),
  sourceSearchUrl: peopleSearchUrlSchema.optional(),
}).strict();

export type ImportRequest = z.infer<typeof importRequestSchema> & { mode: ImportMode };
type ReadImportRequestResult =
  | { error: string; status: 400 | 413; issues?: z.ZodIssue[] }
  | { data: ImportRequest };

export function normalizeImportRequest(input: unknown) {
  const result = importRequestSchema.safeParse(input);
  if (!result.success) return result;
  return { ...result, data: { ...result.data, sourceSearchUrl: result.data.sourceSearchUrl?.trim() } };
}

export function requestBodyExceedsLimit(request: Request, byteLength: number) {
  const contentLength = Number(request.headers.get("content-length"));
  return (Number.isFinite(contentLength) && contentLength > MAX_IMPORT_CONTENT_BYTES) || byteLength > MAX_IMPORT_CONTENT_BYTES;
}

export const MAX_IMPORT_REQUEST_ROWS = MAX_IMPORT_ROWS;

export async function readImportRequest(request: Request): Promise<ReadImportRequestResult> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMPORT_CONTENT_BYTES) {
    return { error: "Import request is too large", status: 413 as const };
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_IMPORT_CONTENT_BYTES) {
    return { error: "Import request is too large", status: 413 as const };
  }

  try {
    const parsed = normalizeImportRequest(JSON.parse(body));
    if (!parsed.success) return { error: `Invalid import request: ${parsed.error.issues[0]?.message ?? "check the submitted fields"}`, status: 400 as const, issues: parsed.error.issues };
    return { data: parsed.data as ImportRequest };
  } catch {
    return { error: "Request body must be valid JSON", status: 400 as const };
  }
}
