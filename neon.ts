import { defineConfig } from "@neon/config/v1";

// Neon Auth is required for default Data API JWT validation.
// AutoZap CRM continues to use NextAuth + Prisma (DATABASE_URL).
// Data API is available at NEON_DATA_API_URL for PostgREST / HTTP clients.
export default defineConfig({
  auth: true,
  dataApi: true,
});
