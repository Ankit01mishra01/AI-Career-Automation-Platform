/** Detect Prisma / PostgreSQL connection failures */
export function isDbConnectionError(error) {
  return (
    error?.name === "PrismaClientInitializationError" ||
    error?.code === "P1000" ||
    error?.code === "P1001" ||
    error?.message?.includes("Authentication failed") ||
    error?.message?.includes("Can't reach database server")
  );
}

export const DB_SETUP_HINT =
  "Database connection failed. Update DATABASE_URL in .env.local (get a fresh connection string from Neon), then run: npm run db:push";
