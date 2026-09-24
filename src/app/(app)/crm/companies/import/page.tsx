import { auth } from "@/lib/auth";
import { PageHeader, Card } from "@/components/layout/Page";
import { ImportForm } from "@/components/crm/ImportForm";

export default async function ImportCompaniesPage() {
  await auth();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Импорт компаний"
        description="CSV / XLSX. Дубли по ИНН, названию или ID пропускаются."
      />
      <Card>
        <ImportForm entity="companies" />
      </Card>
    </div>
  );
}
