import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-response";
import { buildImportPreview } from "@/lib/profile-import-db";
import { readImportRequest } from "@/lib/import-api";
import { privateRouteIsAuthorized } from "@/lib/auth";

export async function POST(request: Request) {
  if (!privateRouteIsAuthorized(request)) return errorResponse("Authentication required", 401);
  const input = await readImportRequest(request);
  if ("error" in input) return errorResponse(input.error, input.status);

  try {
    const preview = await buildImportPreview(prisma, input.data);
    if (!("parsed" in preview)) return errorResponse(preview.error ?? "Selected list was not found", 404);
    return Response.json({
      list: preview.list,
      sourceSearchUrl: input.data.sourceSearchUrl,
      summary: preview.summary,
      invalidRows: preview.parsed.invalidRows,
      duplicateInputRows: preview.parsed.duplicateInputRows,
      records: preview.parsed.candidates,
    });
  } catch {
    return errorResponse("Unable to preview this import", 500);
  }
}
