"use client";

import { Button } from "@/components/ui/Button";

const BITRIX_ENTITIES = new Set(["leads", "companies", "contacts", "deals"]);

export function ExportButtons({ entity }: { entity: string }) {
  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          window.location.href = `/api/v1/export?entity=${entity}&format=csv`;
        }}
      >
        Экспорт CSV
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          window.location.href = `/api/v1/export?entity=${entity}&format=xlsx`;
        }}
      >
        Экспорт XLSX
      </Button>
      {BITRIX_ENTITIES.has(entity) && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            window.location.href = `/api/v1/export?entity=${entity}&format=bitrix24`;
          }}
        >
          Экспорт для Bitrix24
        </Button>
      )}
    </>
  );
}
