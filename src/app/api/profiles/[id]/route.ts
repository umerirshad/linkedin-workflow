import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-response";
import { privateRouteIsAuthorized } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!privateRouteIsAuthorized(request)) return errorResponse("Authentication required", 401);
  const { id } = await params;
  const parsed = profileUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !Object.keys(parsed.data).length) return errorResponse("Invalid profile update");
  try { return Response.json({ profile: await prisma.profile.update({ where: { id }, data: parsed.data }) }); }
  catch { return errorResponse("Unable to update profile", 404); }
}
