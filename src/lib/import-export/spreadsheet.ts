import * as XLSX from "xlsx";

export const CATALOG_REQUIRED_FIELDS = [
  "Наименование",
  "Артикул",
  "Бренд",
  "Цена",
  "Остаток",
  "Фото",
] as const;

export type CatalogValidationResult = {
  rowCount: number;
  validCount: number;
  errorCount: number;
  missingFields: string[];
  duplicateSkus: string[];
  noPriceCount: number;
  noPhotoCount: number;
};

function normalizeHeader(h: string) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const HEADER_ALIASES: Record<string, string> = {
  наименование: "Наименование",
  название: "Наименование",
  name: "Наименование",
  title: "Наименование",
  артикул: "Артикул",
  sku: "Артикул",
  article: "Артикул",
  бренд: "Бренд",
  brand: "Бренд",
  цена: "Цена",
  price: "Цена",
  остаток: "Остаток",
  stock: "Остаток",
  qty: "Остаток",
  фото: "Фото",
  photo: "Фото",
  image: "Фото",
  картинка: "Фото",
};

export function parseSpreadsheet(buffer: Buffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

export function validateCatalogRows(rows: Record<string, unknown>[]): CatalogValidationResult {
  if (rows.length === 0) {
    return {
      rowCount: 0,
      validCount: 0,
      errorCount: 0,
      missingFields: [...CATALOG_REQUIRED_FIELDS],
      duplicateSkus: [],
      noPriceCount: 0,
      noPhotoCount: 0,
    };
  }

  const sampleKeys = Object.keys(rows[0]);
  const mappedHeaders = new Map<string, string>();
  for (const key of sampleKeys) {
    const alias = HEADER_ALIASES[normalizeHeader(key)];
    if (alias) mappedHeaders.set(alias, key);
  }

  const missingFields = CATALOG_REQUIRED_FIELDS.filter((f) => !mappedHeaders.has(f));

  const skuKey = mappedHeaders.get("Артикул");
  const priceKey = mappedHeaders.get("Цена");
  const photoKey = mappedHeaders.get("Фото");
  const nameKey = mappedHeaders.get("Наименование");
  const brandKey = mappedHeaders.get("Бренд");
  const stockKey = mappedHeaders.get("Остаток");

  const skuSeen = new Map<string, number>();
  let validCount = 0;
  let errorCount = 0;
  let noPriceCount = 0;
  let noPhotoCount = 0;
  const duplicateSkus: string[] = [];

  for (const row of rows) {
    let rowOk = true;
    const sku = skuKey ? String(row[skuKey] || "").trim() : "";
    const price = priceKey ? String(row[priceKey] || "").trim() : "";
    const photo = photoKey ? String(row[photoKey] || "").trim() : "";
    const name = nameKey ? String(row[nameKey] || "").trim() : "";
    const brand = brandKey ? String(row[brandKey] || "").trim() : "";
    const stock = stockKey ? String(row[stockKey] || "").trim() : "";

    if (!name || !sku || !brand || !stock) rowOk = false;
    if (!price || Number.isNaN(Number(String(price).replace(",", ".")))) {
      noPriceCount++;
      rowOk = false;
    }
    if (!photo) {
      noPhotoCount++;
      rowOk = false;
    }
    if (sku) {
      const count = (skuSeen.get(sku) || 0) + 1;
      skuSeen.set(sku, count);
      if (count === 2) duplicateSkus.push(sku);
      if (count > 1) rowOk = false;
    }

    if (rowOk) validCount++;
    else errorCount++;
  }

  return {
    rowCount: rows.length,
    validCount,
    errorCount,
    missingFields,
    duplicateSkus: duplicateSkus.slice(0, 50),
    noPriceCount,
    noPhotoCount,
  };
}

export function rowsToWorkbook(rows: Record<string, unknown>[], sheetName = "Export") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}
