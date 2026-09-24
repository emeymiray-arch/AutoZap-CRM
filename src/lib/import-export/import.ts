import { prisma } from "@/lib/db";
import { parseSpreadsheet } from "./spreadsheet";
import { writeAudit } from "@/lib/audit";

export type ImportPreview = {
  total: number;
  newCount: number;
  dupeCount: number;
  errorCount: number;
  errors: string[];
  rows: Record<string, unknown>[];
  dupes: number[];
  news: number[];
};

function cell(row: Record<string, unknown>, ...keys: string[]) {
  for (const k of keys) {
    if (row[k] != null && String(row[k]).trim() !== "") return String(row[k]).trim();
    const found = Object.keys(row).find((x) => x.toLowerCase() === k.toLowerCase());
    if (found && row[found] != null && String(row[found]).trim() !== "")
      return String(row[found]).trim();
  }
  return null;
}

export async function previewImport(entity: string, buffer: Buffer): Promise<ImportPreview> {
  const rows = parseSpreadsheet(buffer);
  const errors: string[] = [];
  const dupes: number[] = [];
  const news: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (entity === "leads") {
        const title = cell(row, "title", "название", "Title");
        const id = cell(row, "id", "ID");
        if (!title && !id) {
          errors.push(`Строка ${i + 2}: нет названия`);
          continue;
        }
        if (id) {
          const exists = await prisma.lead.findUnique({ where: { id } });
          if (exists) {
            dupes.push(i);
            continue;
          }
        }
        const phone = cell(row, "phone", "телефон");
        const email = cell(row, "email");
        if (phone || email) {
          const exists = await prisma.lead.findFirst({
            where: {
              archivedAt: null,
              OR: [
                ...(phone ? [{ phone }] : []),
                ...(email ? [{ email }] : []),
              ],
            },
          });
          if (exists) {
            dupes.push(i);
            continue;
          }
        }
        news.push(i);
      } else if (entity === "companies") {
        const name = cell(row, "name", "название", "TITLE");
        const id = cell(row, "id", "ID", "UF_AUTOZAP_ID");
        const inn = cell(row, "inn", "ИНН", "INN");
        if (!name && !id) {
          errors.push(`Строка ${i + 2}: нет названия`);
          continue;
        }
        if (id) {
          const exists = await prisma.company.findUnique({ where: { id } });
          if (exists) {
            dupes.push(i);
            continue;
          }
        }
        const exists = await prisma.company.findFirst({
          where: {
            archivedAt: null,
            OR: [
              ...(inn ? [{ inn }] : []),
              ...(name ? [{ name }] : []),
            ],
          },
        });
        if (exists) {
          dupes.push(i);
          continue;
        }
        news.push(i);
      } else if (entity === "contacts") {
        const firstName = cell(row, "firstName", "имя", "NAME");
        const id = cell(row, "id", "UF_AUTOZAP_ID");
        const phone = cell(row, "phone", "телефон", "PHONE");
        const email = cell(row, "email", "EMAIL");
        if (!firstName && !id) {
          errors.push(`Строка ${i + 2}: нет имени`);
          continue;
        }
        if (id) {
          const exists = await prisma.contact.findUnique({ where: { id } });
          if (exists) {
            dupes.push(i);
            continue;
          }
        }
        if (phone || email) {
          const exists = await prisma.contact.findFirst({
            where: {
              archivedAt: null,
              OR: [
                ...(phone ? [{ phone }] : []),
                ...(email ? [{ email }] : []),
              ],
            },
          });
          if (exists) {
            dupes.push(i);
            continue;
          }
        }
        news.push(i);
      } else {
        errors.push(`Импорт для ${entity} пока не поддерживается`);
        break;
      }
    } catch (e) {
      errors.push(`Строка ${i + 2}: ${e instanceof Error ? e.message : "ошибка"}`);
    }
  }

  return {
    total: rows.length,
    newCount: news.length,
    dupeCount: dupes.length,
    errorCount: errors.length,
    errors: errors.slice(0, 50),
    rows,
    dupes,
    news,
  };
}

export async function commitImport(
  entity: string,
  buffer: Buffer,
  userId: string,
  onlyNew = true
) {
  const preview = await previewImport(entity, buffer);
  let created = 0;
  const indices = onlyNew ? preview.news : preview.news.concat(preview.dupes);

  for (const i of indices) {
    if (preview.dupes.includes(i) && onlyNew) continue;
    const row = preview.rows[i];
    if (entity === "leads") {
      await prisma.lead.create({
        data: {
          title: cell(row, "title", "название", "Title") || "Без названия",
          phone: cell(row, "phone", "телефон"),
          email: cell(row, "email"),
          city: cell(row, "city", "город"),
          region: cell(row, "region", "регион"),
          source: cell(row, "source", "источник", "SOURCE_ID"),
          comment: cell(row, "comment", "комментарий", "COMMENTS"),
          responsibleId: userId,
          createdById: userId,
        },
      });
      created++;
    } else if (entity === "companies") {
      await prisma.company.create({
        data: {
          name: cell(row, "name", "название", "TITLE") || "Без названия",
          inn: cell(row, "inn", "ИНН", "INN"),
          phone: cell(row, "phone", "телефон", "PHONE"),
          email: cell(row, "email", "EMAIL"),
          website: cell(row, "website", "сайт", "WEB"),
          city: cell(row, "city", "город", "ADDRESS_CITY"),
          region: cell(row, "region", "регион", "ADDRESS_REGION"),
          notes: cell(row, "notes", "заметки", "COMMENTS"),
          responsibleId: userId,
          createdById: userId,
        },
      });
      created++;
    } else if (entity === "contacts") {
      await prisma.contact.create({
        data: {
          firstName: cell(row, "firstName", "имя", "NAME") || "Без имени",
          lastName: cell(row, "lastName", "фамилия", "LAST_NAME"),
          position: cell(row, "position", "должность", "POST"),
          phone: cell(row, "phone", "телефон", "PHONE"),
          email: cell(row, "email", "EMAIL"),
          comment: cell(row, "comment", "комментарий", "COMMENTS"),
          responsibleId: userId,
          createdById: userId,
        },
      });
      created++;
    }
  }

  await writeAudit({
    userId,
    entityType: entity,
    entityId: "import",
    action: "import",
    summary: `Импорт ${entity}: создано ${created}, пропущено дублей ${preview.dupeCount}`,
    newValue: { created, skippedDupes: preview.dupeCount },
  });

  return { created, skippedDupes: preview.dupeCount, errors: preview.errorCount };
}
