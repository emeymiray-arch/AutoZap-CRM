import { NextRequest, NextResponse } from "next/server";
import { createReadStream, existsSync } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { requireApiUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { assertCanAccessRecord } from "@/lib/access";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  const { id } = await ctx.params;

  const catalog = await prisma.catalog.findUnique({ where: { id } });
  if (!catalog?.filePath) return jsonError("Файл не найден", 404);

  try {
    assertCanAccessRecord(user, catalog);
  } catch {
    return jsonError("Forbidden", 403);
  }

  const abs = path.join(process.cwd(), catalog.filePath);
  const root = path.join(process.cwd(), "uploads");
  if (!abs.startsWith(root) || !existsSync(abs)) {
    return jsonError("Файл не найден", 404);
  }

  const info = await stat(abs);
  const stream = createReadStream(abs);
  const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": catalog.fileMime || "application/octet-stream",
      "Content-Length": String(info.size),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(catalog.fileName || "catalog")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
