import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/Page";
import { ImportForm } from "@/components/crm/ImportForm";

export default async function LeadsImportPage() {
  await auth();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Импорт лидов"
        description="Загрузите CSV или XLSX, проверьте предпросмотр и подтвердите импорт"
      />
      <ImportForm entity="leads" />
    </div>
  );
}
