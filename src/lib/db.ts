import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/** Параметры для Neon pooler на Vercel: без них соединение часто «Closed» после idle. */
function databaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");

  try {
    const url = new URL(raw);
    const isPooler = url.hostname.includes("-pooler");
    if (isPooler && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "30");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "30");
    }
    // Один клиент на инстанс Fluid / serverless
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function isTransientDbError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: unknown }).code)
      : "";
  return (
    code === "P1001" ||
    code === "P1002" ||
    code === "P1017" ||
    /closed|connection.*reset|can't reach|timed out|ECONNRESET|ETIMEDOUT|Server has closed/i.test(
      msg,
    )
  );
}

function createPrismaClient(): PrismaClient {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: { url: databaseUrl() },
    },
  });

  // Один повтор при обрыве Neon (scale-to-zero / idle pooler)
  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (err) {
          if (!isTransientDbError(err)) throw err;
          try {
            await base.$disconnect();
          } catch {
            /* ignore */
          }
          await new Promise((r) => setTimeout(r, 250));
          return query(args);
        }
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

globalForPrisma.prisma = prisma;
