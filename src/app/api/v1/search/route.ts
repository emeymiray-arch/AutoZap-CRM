import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, jsonOk } from "@/lib/api";
import { globalSearch } from "@/lib/search";

export async function GET(req: NextRequest) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  const q = req.nextUrl.searchParams.get("q") || "";
  const result = await globalSearch(q, user);
  return jsonOk(result);
}
