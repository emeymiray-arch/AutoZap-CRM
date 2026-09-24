import { NeonPostgrestClient, fetchWithToken } from "@neondatabase/postgrest-js";

/**
 * Neon Data API (PostgREST) client.
 * Base URL: NEON_DATA_API_URL
 * Auth: JWT from Neon Auth (NEON_AUTH_BASE_URL) — pass getAccessToken.
 *
 * CRM app data path remains Prisma + DATABASE_URL.
 * Use this client for HTTP/PostgREST integrations and edge-friendly queries.
 */
export function getNeonDataApiUrl() {
  const url = process.env.NEON_DATA_API_URL;
  if (!url) {
    throw new Error("NEON_DATA_API_URL is not set. Run: neon env pull -e NEON_DATA_API_URL");
  }
  return url.replace(/\/$/, "");
}

export function createNeonDataApiClient(getAccessToken: () => Promise<string | null>) {
  return new NeonPostgrestClient({
    dataApiUrl: getNeonDataApiUrl(),
    options: {
      global: {
        fetch: fetchWithToken(async () => {
          const token = await getAccessToken();
          if (!token) throw new Error("Neon Data API requires a JWT (Neon Auth session)");
          return token;
        }),
      },
    },
  });
}

/** Direct REST helper for server routes that already have a JWT */
export async function neonDataApiFetch(
  path: string,
  options: { token: string; method?: string; body?: unknown; search?: string } 
) {
  const base = getNeonDataApiUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}${options.search || ""}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${options.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      Prefer: "count=exact",
    },
    body: options.body != null ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { ok: res.ok, status: res.status, data: json };
}
