import { NextRequest } from "next/server";
import { listHandler, createHandler } from "@/lib/api-crud";

export async function GET(req: NextRequest) {
  return listHandler("contacts", req);
}
export async function POST(req: NextRequest) {
  return createHandler("contacts", req);
}
