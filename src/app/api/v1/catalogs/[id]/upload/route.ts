import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireApiUser, jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/db";
import { parseSpreadsheet, validateCatalogRows } from "@/lib/import-export/spreadsheet";
import { writeAudit, logActivity } from "@/lib/audit";
import { changeStatus } from "@/lib/entity-actions";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  const { id } = await ctx.params;

  const catalog = await prisma.catalog.findUnique({ where: { id } });
  if (!catalog) return jsonError("Каталог не найден", 404);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Файл обязателен");

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "uploads", "catalogs");
  await mkdir(uploadsDir, { recursive: true });
  const safeName = `${id}-${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
  const filePath = path.join(uploadsDir, safeName);
  await writeFile(filePath, buffer);

  let validation = {
    rowCount: 0,
    validCount: 0,
    errorCount: 0,
    missingFields: [] as string[],
    duplicateSkus: [] as string[],
    noPriceCount: 0,
    noPhotoCount: 0,
  };

  try {
    const rows = parseSpreadsheet(buffer);
    validation = validateCatalogRows(rows);
  } catch {
    // non-spreadsheet: store file only
  }

  const updated = await prisma.catalog.update({
    where: { id },
    data: {
      fileName: file.name,
      filePath: `uploads/catalogs/${safeName}`,
      fileMime: file.type || null,
      rowCount: validation.rowCount,
      validCount: validation.validCount,
      errorCount: validation.errorCount,
      missingFields: validation.missingFields.join(", "),
      duplicateSkus: validation.duplicateSkus.join(", "),
      noPriceCount: validation.noPriceCount,
      noPhotoCount: validation.noPhotoCount,
      skuCount: validation.rowCount || catalog.skuCount,
      receivedAt: catalog.receivedAt || new Date(),
      status: catalog.status === "EXPECTED" ? "RECEIVED" : catalog.status,
    },
  });

  await writeAudit({
    userId: user.id,
    entityType: "catalog",
    entityId: id,
    action: "upload",
    summary: `${user.name} загрузил(а) файл каталога`,
    newValue: validation,
  });
  await logActivity({
    type: "FILE_UPLOAD",
    authorId: user.id,
    comment: `Загружен файл ${file.name}`,
    catalogId: id,
    partnerId: catalog.partnerId,
    companyId: catalog.companyId,
  });

  if (catalog.status === "EXPECTED") {
    await changeStatus({ entity: "catalog", id, newStatus: "RECEIVED", user });
  }

  return jsonOk({ catalog: updated, validation });
}
