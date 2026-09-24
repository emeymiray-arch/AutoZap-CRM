import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, jsonError } from "@/lib/api";
import { exportEntityRows, serializeExport } from "@/lib/import-export/export";
import { canExportData } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (!canExportData(user.role)) return jsonError("Экспорт доступен администратору и руководству", 403);

  const entity = req.nextUrl.searchParams.get("entity") || "leads";
  const format = (req.nextUrl.searchParams.get("format") || "csv") as
    | "csv"
    | "xlsx"
    | "bitrix24";

  try {
    const rows = (await exportEntityRows(entity, format === "bitrix24", user)) as Record<
      string,
      unknown
    >[];
    const file = serializeExport(rows, format);
    return new NextResponse(new Uint8Array(Buffer.isBuffer(file.body) ? file.body : Buffer.from(file.body)), {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${entity}-${file.filename}"`,
      },
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Export failed", 400);
  }
}
