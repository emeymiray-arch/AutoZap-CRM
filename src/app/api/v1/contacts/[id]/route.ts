import { NextRequest } from "next/server";
import { getHandler, patchHandler, deleteHandler } from "@/lib/api-crud";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return getHandler("contacts", id);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return patchHandler("contacts", id, req);
}
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return deleteHandler("contacts", id);
}
