import { prisma } from "@/lib/db";
import {
  mapCompanyToBitrix,
  mapContactToBitrix,
  mapLeadToBitrix,
  mapDealToBitrix,
} from "@/lib/integrations/bitrix24/mapper";
import { rowsToCsv, rowsToWorkbook } from "@/lib/import-export/spreadsheet";
import type { SessionUser } from "@/lib/permissions";
import { scopeWhere } from "@/lib/list-query";

export async function exportEntityRows(
  entity: string,
  bitrix = false,
  user?: SessionUser
) {
  const scope = user ? scopeWhere(user) : {};
  switch (entity) {
    case "leads": {
      const rows = await prisma.lead.findMany({ where: { archivedAt: null, ...scope } });
      return bitrix ? rows.map(mapLeadToBitrix) : rows;
    }
    case "companies": {
      const rows = await prisma.company.findMany({ where: { archivedAt: null, ...scope } });
      return bitrix ? rows.map(mapCompanyToBitrix) : rows;
    }
    case "contacts": {
      const rows = await prisma.contact.findMany({ where: { archivedAt: null, ...scope } });
      return bitrix ? rows.map(mapContactToBitrix) : rows;
    }
    case "deals": {
      const rows = await prisma.deal.findMany({ where: { archivedAt: null, ...scope } });
      return bitrix ? rows.map(mapDealToBitrix) : rows;
    }
    case "partners":
      if (bitrix) throw new Error("Bitrix24 export доступен для leads/companies/contacts/deals");
      return prisma.partner.findMany({ where: { archivedAt: null, ...scope } });
    case "stores":
      if (bitrix) throw new Error("Bitrix24 export доступен для leads/companies/contacts/deals");
      return prisma.store.findMany({ where: { archivedAt: null, ...scope } });
    case "tasks":
      if (bitrix) throw new Error("Bitrix24 export доступен для leads/companies/contacts/deals");
      return prisma.task.findMany({ where: { archivedAt: null, ...scope } });
    case "catalogs":
      if (bitrix) throw new Error("Bitrix24 export доступен для leads/companies/contacts/deals");
      return prisma.catalog.findMany({ where: { archivedAt: null, ...scope } });
    default:
      throw new Error("Unknown entity");
  }
}

export function serializeExport(
  rows: Record<string, unknown>[],
  format: "csv" | "xlsx" | "bitrix24"
) {
  const flat = rows.map((r) => {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) {
      if (v instanceof Date) o[k] = v.toISOString();
      else if (typeof v === "object" && v !== null) o[k] = JSON.stringify(v);
      else o[k] = v;
    }
    return o;
  });

  if (format === "csv") {
    return {
      body: rowsToCsv(flat),
      contentType: "text/csv; charset=utf-8",
      filename: "export.csv",
    };
  }
  return {
    body: rowsToWorkbook(flat),
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    filename: format === "bitrix24" ? "bitrix24-export.xlsx" : "export.xlsx",
  };
}
