import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        // На Vercel/Neon всегда используем pooler URL; connection_limit=1 на инстанс
        url: process.env.DATABASE_URL,
      },
    },
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

// На Fluid Compute инстансы переиспользуются — держим один клиент
globalForPrisma.prisma = prisma;
