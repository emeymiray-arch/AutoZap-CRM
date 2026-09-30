import { NextResponse } from "next/server";
import { processOverdueTasks } from "@/lib/automations";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Vercel Cron: каждые 5 минут помечает просроченные задачи.
 * Защита: Authorization: Bearer $CRON_SECRET (Vercel подставляет автоматически)
 * или заголовок x-vercel-cron.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-vercel-cron");
  const secret = process.env.CRON_SECRET;

  const ok =
    cronHeader === "1" ||
    (secret && auth === `Bearer ${secret}`) ||
    (process.env.NODE_ENV !== "production" && !secret);

  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await processOverdueTasks();
    return NextResponse.json({ ok: true, overdueMarked: count, at: new Date().toISOString() });
  } catch (e) {
    console.error("[cron/overdue]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
