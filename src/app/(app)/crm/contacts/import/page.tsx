import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader, Card } from "@/components/layout/Page";
import { ImportForm } from "@/components/crm/ImportForm";
import { canExportData } from "@/lib/permissions";

export default async function ImportContactsPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (!canExportData(session.user.role)) redirect("/crm/contacts");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Импорт контактов"
        description="CSV / XLSX. Только администратор и руководство."
      />
      <Card>
        <ImportForm entity="contacts" />
      </Card>
    </div>
  );
}
