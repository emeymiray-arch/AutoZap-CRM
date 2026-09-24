import { NextResponse } from "next/server";
import { requireApiUser, jsonError, jsonOk } from "@/lib/api";
import { getNeonDataApiUrl } from "@/lib/neon-data-api";

/**
 * Connection status for Neon Data API.
 * Does not expose secrets — only confirms env + endpoint reachability.
 */
export async function GET() {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;

  try {
    const url = getNeonDataApiUrl();
    const probe = await fetch(`${url}/`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const body = await probe.text();

    return jsonOk({
      connected: true,
      url,
      authBaseUrl: process.env.NEON_AUTH_BASE_URL || null,
      jwksUrl: process.env.NEON_AUTH_JWKS_URL || null,
      branch: process.env.NEON_BRANCH || null,
      endpointStatus: probe.status,
      endpointMessage: body.slice(0, 200),
      note:
        "Data API требует JWT (Neon Auth). CRM работает через Prisma/DATABASE_URL. Для REST-запросов нужен Bearer token из Neon Auth.",
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Data API not configured", 500);
  }
}
