import { NextRequest } from "next/server";
import { archiveHandler } from "@/lib/api-crud";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return archiveHandler("leads", id);
}
