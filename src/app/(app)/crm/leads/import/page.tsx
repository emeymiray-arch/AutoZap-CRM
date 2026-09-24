import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/Page";
import { ImportForm } from "@/components/crm/ImportForm";
import { canExportData } from "@/lib/permissions";

export default async function ImportLeadsPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (!canExportData(session.user.role)) redirect("/crm/leads");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Импорт лидов" description="Только администратор и руководство" />
      <ImportForm entity="leads" />
    </div>
  );
}
