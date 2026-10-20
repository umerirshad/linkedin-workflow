import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-response";
import { privateRouteIsAuthorized } from "@/lib/auth";
import { membershipActionSchema } from "@/lib/validation";

async function readIds(request: Request) { const parsed = membershipActionSchema.safeParse(await request.json().catch(() => null)); return parsed.success ? parsed.data.profileIds : null; }
export async function POST(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  if (!privateRouteIsAuthorized(request)) return errorResponse("Authentication required", 401); const { listId } = await params; const profileIds = await readIds(request); if (!profileIds) return errorResponse("Select at least one profile");
  try { const result = await prisma.$transaction(async (tx) => { const [list, count] = await Promise.all([tx.profileList.findUnique({ where: { id: listId }, select: { id: true } }), tx.profile.count({ where: { id: { in: profileIds } } })]); if (!list) throw new Error("LIST_NOT_FOUND"); if (count !== new Set(profileIds).size) throw new Error("PROFILE_NOT_FOUND"); return tx.listProfile.createMany({ data: [...new Set(profileIds)].map((profileId) => ({ listId, profileId })), skipDuplicates: true }); }); return Response.json({ added: result.count }); }
  catch (error) { if (error instanceof Error && error.message === "LIST_NOT_FOUND") return errorResponse("List not found", 404); if (error instanceof Error && error.message === "PROFILE_NOT_FOUND") return errorResponse("One or more profiles were not found"); return errorResponse("Unable to add profiles to list", 500); }
}
export async function DELETE(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  if (!privateRouteIsAuthorized(request)) return errorResponse("Authentication required", 401); const { listId } = await params; const profileIds = await readIds(request); if (!profileIds) return errorResponse("Select at least one profile");
  try { const result = await prisma.listProfile.deleteMany({ where: { listId, profileId: { in: [...new Set(profileIds)] } } }); return Response.json({ removed: result.count }); } catch { return errorResponse("Unable to remove profiles from list", 500); }
}
