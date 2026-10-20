import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-response";
import { privateRouteIsAuthorized } from "@/lib/auth";
import { listInputSchema } from "@/lib/validation";

export async function GET(request: Request) {
  if (!privateRouteIsAuthorized(request)) return errorResponse("Authentication required", 401);
  try {
    const lists = await prisma.profileList.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { memberships: true } } },
    });
    return Response.json({ lists: lists.map(({ _count, ...list }) => ({ ...list, memberCount: _count.memberships })) });
  } catch {
    return errorResponse("Unable to load lists", 500);
  }
}

export async function POST(request: Request) {
  if (!privateRouteIsAuthorized(request)) return errorResponse("Authentication required", 401);
  try {
    const result = listInputSchema.extend({}).strict().safeParse(await request.json());
    if (!result.success) return errorResponse("Invalid list details");
    const list = await prisma.profileList.create({ data: result.data });
    return Response.json({ list }, { status: 201 });
  } catch {
    return errorResponse("Unable to create list", 500);
  }
}
