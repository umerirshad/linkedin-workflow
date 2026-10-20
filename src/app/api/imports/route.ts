import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-response";
import { readImportRequest } from "@/lib/import-api";
import { buildImportPreview, importParsedProfiles } from "@/lib/profile-import-db";
import { privateRouteIsAuthorized } from "@/lib/auth";

export async function POST(request: Request) {
  if (!privateRouteIsAuthorized(request)) return errorResponse("Authentication required", 401);
  const input = await readImportRequest(request);
  if ("error" in input) return errorResponse(input.error, input.status);

  try {
    const preview = await buildImportPreview(prisma, input.data);
    if (!("parsed" in preview)) return errorResponse(preview.error ?? "Selected list was not found", 404);
    const result = await importParsedProfiles(prisma, input.data, preview);
    return Response.json({
      summary: {
        ...preview.summary,
        profilesCreated: result.profilesCreated,
        membershipsAdded: result.membershipsAdded,
      },
      importRunId: result.run.id,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Selected list was not found") return errorResponse(error.message, 404);
    return errorResponse("Import could not be completed", 409);
  }
}
