import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-response";
import { privateRouteIsAuthorized } from "@/lib/auth";
import { buildProfileWhere } from "@/lib/profile-query";
import { profileQuerySchema } from "@/lib/validation";

export async function GET(request: Request) {
  if (!privateRouteIsAuthorized(request)) return errorResponse("Authentication required", 401);
  const parsed = profileQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
  if (!parsed.success) return errorResponse("Invalid profile filters");
  const { page, pageSize } = parsed.data;
  const where = buildProfileWhere(parsed.data);
  try {
    const [totalItems, profiles] = await Promise.all([
      prisma.profile.count({ where }),
      prisma.profile.findMany({ where, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize,
        select: { id: true, fullName: true, firstName: true, lastName: true, profileUrl: true, headline: true, company: true, notes: true, pictureStatus: true, status: true, createdAt: true, updatedAt: true, memberships: { select: { list: { select: { id: true, name: true } } } } },
      }),
    ]);
    const totalPages = Math.ceil(totalItems / pageSize);
    return Response.json({ profiles, pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } });
  } catch { return errorResponse("Unable to load profiles", 500); }
}
