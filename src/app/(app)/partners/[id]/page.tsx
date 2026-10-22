import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { RegionSelect } from "@/components/crm/GeoFields";
import { EntityActions } from "@/components/crm/EntityActions";
import { PARTNER_FUNNEL_ORDER, PARTNER_STATUS_LABELS } from "@/lib/labels";
import { canHardDelete } from "@/lib/permissions";
import { updatePartnerAction } from "@/lib/actions";
import { usersForSelect } from "@/lib/list-query";

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: { company: true, contact: true, responsible: true },
  });
  if (!partner) notFound();
  const users = await usersForSelect();
  const action = updatePartnerAction.bind(null, id);
  const c = partner.contact;
  const statusOptions = PARTNER_FUNNEL_ORDER.includes(partner.status as never)
    ? [...PARTNER_FUNNEL_ORDER]
    : [partner.status, ...PARTNER_FUNNEL_ORDER];

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title={partner.name}
        description="Партнёр — можно менять любые поля"
        actions={
          <EntityActions
            entity="partner"
            id={partner.id}
            archived={partner.archivedAt}
            canDelete={canHardDelete(session.user.role)}
            editHref={`/partners/${partner.id}/edit`}
            restoreTo={`/partners/${partner.id}`}
            listHref="/partners"
            hideEdit
          />
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge status={partner.status}>{PARTNER_STATUS_LABELS[partner.status] || partner.status}</Badge>
        <Button href="/partners?view=funnel" size="sm" variant="secondary">
          Воронка
        </Button>
      </div>
      <Card title="Редактирование">
        <form action={action} className="grid gap-3">
          {partner.contactId ? <input type="hidden" name="contactId" value={partner.contactId} /> : null}
          <Input name="name" label="Название компании" required defaultValue={partner.name} />
          <RegionSelect
            name="city"
            label="Регион"
            defaultValue={partner.company?.city || partner.region || ""}
          />

          <div className="rounded-xl bg-slate-50 p-3">
            <div className="mb-2 text-sm font-medium text-slate-800">Контакт</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="contactFirstName" label="Имя" defaultValue={c?.firstName || ""} />
              <Input name="contactPhone" label="Телефон" type="tel" defaultValue={c?.phone || ""} />
            </div>
          </div>

          <Select name="status" label="Этап" defaultValue={partner.status}>
            {statusOptions.map((k) => (
              <option key={k} value={k}>
                {PARTNER_STATUS_LABELS[k] || k}
              </option>
            ))}
          </Select>
          <Select name="responsibleId" label="Ответственный" defaultValue={partner.responsibleId || ""}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          <Textarea name="comment" label="Комментарий" defaultValue={partner.comment || ""} rows={2} />
          <FormSubmitButton>Сохранить изменения</FormSubmitButton>
        </form>
      </Card>
    </div>
  );
}
