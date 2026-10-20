import { PrismaPg } from "@prisma/adapter-pg";

type PrismaClientConstructor = new (options: { adapter: PrismaPg }) => unknown;

const globalForPrisma = globalThis as unknown as { prisma?: unknown };

/** The generated Prisma client is created by `prisma generate` in a database-enabled environment. */
export async function getPrismaClient(): Promise<unknown> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const clientModule = (await import("@prisma/client")) as unknown as {
    PrismaClient: PrismaClientConstructor;
  };
  const client = new clientModule.PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}
