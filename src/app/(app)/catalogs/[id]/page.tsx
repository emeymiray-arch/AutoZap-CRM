import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, formatDateTime } from "@/components/layout/Page";
import { Badge } from "@/components/ui/Badge";
import { EntityActions } from "@/components/crm/EntityActions";
import { ActivityFeed } from "@/components/crm/ActivityFeed";
import { AuditPanel } from "@/components/crm/AuditPanel";
import { UploadCatalogForm } from "@/components/crm/UploadCatalogForm";
import { CATALOG_STATUS_LABELS } from "@/lib/labels";
import { canHardDelete } from "@/lib/permissions";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { updateCatalogAction } from "@/lib/actions";
import { companiesForSelect, partnersForSelect, usersForSelect } from "@/lib/list-query";

export default async function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const catalog = await prisma.catalog.findUnique({
    where: { id },
    include: { partner: true, company: true, responsible: true },
  });
  if (!catalog) notFound();
  const [companies, partners, users] = await Promise.all([
    companiesForSelect(),
    partnersForSelect(),
    usersForSelect(),
  ]);
  const action = updateCatalogAction.bind(null, id);

  return (
    <div>
      <PageHeader
        title={catalog.name}
        description={`ID: ${catalog.id}`}
        actions={
          <EntityActions
            entity="catalog"
            id={catalog.id}
            archived={catalog.archivedAt}
            canDelete={canHardDelete(session.user.role)}
            editHref={`/catalogs/${id}/edit`}
            restoreTo={`/catalogs/${id}`}
          />
        }
      />
      <Badge status={catalog.status}>{CATALOG_STATUS_LABELS[catalog.status] || catalog.status}</Badge>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Данные и статус" className="lg:col-span-2">
          <form action={action} className="grid gap-3 md:grid-cols-2">
            <Input name="name" label="Название" required defaultValue={catalog.name} className="md:col-span-2" />
            <Select name="partnerId" label="Партнёр" defaultValue={catalog.partnerId || ""}>
              <option value="">—</option>
              {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <Select name="companyId" label="Компания" defaultValue={catalog.companyId || ""}>
              <option value="">—</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select name="status" label="Статус" defaultValue={catalog.status}>
              {Object.entries(CATALOG_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Input name="skuCount" label="SKU" type="number" defaultValue={catalog.skuCount ?? undefined} />
            <Select name="responsibleId" label="Ответственный" defaultValue={catalog.responsibleId || ""}>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
            <Textarea name="comment" label="Комментарий" defaultValue={catalog.comment || ""} className="md:col-span-2" />
            <div className="md:col-span-2"><Button type="submit" size="sm">Сохранить</Button></div>
          </form>

          <div className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
            <div>Строк: <b>{catalog.rowCount ?? "—"}</b></div>
            <div>Корректных: <b>{catalog.validCount ?? "—"}</b></div>
            <div>Ошибок: <b>{catalog.errorCount ?? "—"}</b></div>
            <div>Без цены: <b>{catalog.noPriceCount ?? "—"}</b></div>
            <div>Без фото: <b>{catalog.noPhotoCount ?? "—"}</b></div>
            <div>Получен: <b>{formatDateTime(catalog.receivedAt)}</b></div>
            <div className="sm:col-span-2">Отсутствующие поля: {catalog.missingFields || "—"}</div>
            <div className="sm:col-span-2">Дубли артикулов: {catalog.duplicateSkus || "—"}</div>
            {catalog.filePath && (
              <div className="sm:col-span-2">
                Файл:{" "}
                <a
                  className="text-teal-800 underline"
                  href={`/${catalog.filePath.replace(/^uploads\//, "uploads/")}`}
                  download={catalog.fileName || true}
                >
                  {catalog.fileName}
                </a>
              </div>
            )}
          </div>

          <div className="mt-4">
            <h3 className="mb-2 text-sm font-semibold">Загрузить / заменить файл</h3>
            <UploadCatalogForm catalogId={catalog.id} />
          </div>
        </Card>
        <Card title="Активности">
          <ActivityFeed where={{ catalogId: catalog.id, partnerId: catalog.partnerId, companyId: catalog.companyId }} redirectTo={`/catalogs/${id}`} />
        </Card>
      </div>
      <div className="mt-4"><Card title="Аудит"><AuditPanel entityType="catalog" entityId={id} /></Card></div>
    </div>
  );
}
