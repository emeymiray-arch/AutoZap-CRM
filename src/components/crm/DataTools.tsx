import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { ExportButtons } from "@/components/crm/ExportButtons";
import { canExportData } from "@/lib/permissions";

/** Экспорт / импорт — только администратор и руководство */
export async function DataTools({
  entity,
  importHref,
}: {
  entity: string;
  importHref?: string;
}) {
  const session = await auth();
  if (!session?.user || !canExportData(session.user.role)) return null;

  return (
    <>
      <ExportButtons entity={entity} />
      {importHref ? (
        <Button href={importHref} variant="secondary" size="sm">
          Импорт
        </Button>
      ) : null}
    </>
  );
}
