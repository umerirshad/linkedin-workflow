import { Prisma } from "@prisma/client";

import { profileQuerySchema } from "./validation.ts";

export function buildProfileWhere(input: ReturnType<typeof profileQuerySchema.parse>): Prisma.ProfileWhereInput {
  const where: Prisma.ProfileWhereInput = {};
  const conditions: Prisma.ProfileWhereInput[] = [];
  if (input.search) conditions.push({ OR: [
    { fullName: { contains: input.search, mode: "insensitive" } },
    { headline: { contains: input.search, mode: "insensitive" } },
    { company: { contains: input.search, mode: "insensitive" } },
    { profileUrl: { contains: input.search, mode: "insensitive" } },
  ] });
  if (input.pictureStatus) where.pictureStatus = input.pictureStatus;
  if (input.listId) where.memberships = { some: { listId: input.listId } };
  if (input.notes === "present") conditions.push({ AND: [{ notes: { not: null } }, { notes: { not: "" } }] });
  if (input.notes === "missing") conditions.push({ OR: [{ notes: null }, { notes: "" }] });
  if (conditions.length) where.AND = conditions;
  return where;
}
