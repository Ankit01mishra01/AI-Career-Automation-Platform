import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

/** Reuse Prisma client across hot reloads in development */
export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
