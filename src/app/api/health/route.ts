import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Healthcheck для мониторинга аптайма (UptimeRobot / Better Stack) */
export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      db: "up",
      ms: Date.now() - started,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[health]", e);
    return NextResponse.json(
      { ok: false, db: "down", ms: Date.now() - started },
      { status: 503 },
    );
  }
}
