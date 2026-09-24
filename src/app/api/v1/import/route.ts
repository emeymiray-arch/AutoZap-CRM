import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, jsonError, jsonOk } from "@/lib/api";
import { previewImport, commitImport } from "@/lib/import-export/import";
import { canExportData } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (!canExportData(user.role)) return jsonError("Импорт доступен администратору и руководству", 403);

  const entity = req.nextUrl.searchParams.get("entity") || "leads";
  const mode = req.nextUrl.searchParams.get("mode") || "preview";

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Файл обязателен");

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    if (mode === "commit") {
      const result = await commitImport(entity, buffer, user.id, true);
      return jsonOk(result);
    }
    const preview = await previewImport(entity, buffer);
    return jsonOk({
      total: preview.total,
      newCount: preview.newCount,
      dupeCount: preview.dupeCount,
      errorCount: preview.errorCount,
      errors: preview.errors,
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Import failed", 400);
  }
}
