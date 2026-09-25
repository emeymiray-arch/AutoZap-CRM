import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, formatDateTime } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { EntityActions } from "@/components/crm/EntityActions";
import { ActivityFeed } from "@/components/crm/ActivityFeed";
import { AuditPanel } from "@/components/crm/AuditPanel";
import { canHardDelete } from "@/lib/permissions";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: true,
      responsible: true,
      partners: { where: { archivedAt: null }, select: { id: true, name: true } },
    },
  });
  if (!contact) notFound();

  return (
    <div>
      <PageHeader
        title={`${contact.firstName} ${contact.lastName || ""}`.trim()}
        description={`ID: ${contact.id}`}
        actions={
          <EntityActions
            entity="contact"
            id={contact.id}
            archived={contact.archivedAt}
            canDelete={canHardDelete(session.user.role)}
            editHref={`/crm/contacts/${contact.id}/edit`}
            restoreTo={`/crm/contacts/${contact.id}`}
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Карточка" className="lg:col-span-2">
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              ["Должность", contact.position],
              [
                "Партнёры",
                contact.partners.length
                  ? contact.partners.map((p) => (
                      <Button key={p.id} href={`/partners/${p.id}`} variant="ghost" size="sm">
                        {p.name}
                      </Button>
                    ))
                  : null,
              ],
              ["Телефон", contact.phone],
              ["Email", contact.email],
              ["Telegram", contact.telegram],
              ["WhatsApp", contact.whatsapp],
              ["Ответственный", contact.responsible?.name],
              ["Создан", formatDateTime(contact.createdAt)],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="font-medium text-slate-900">{v || "—"}</dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500">Комментарий</dt>
              <dd className="whitespace-pre-wrap">{contact.comment || "—"}</dd>
            </div>
          </dl>
        </Card>
        <Card title="Активности">
          <ActivityFeed
            where={{ contactId: contact.id, companyId: contact.companyId }}
            redirectTo={`/crm/contacts/${contact.id}`}
          />
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Аудит">
          <AuditPanel entityType="contact" entityId={contact.id} />
        </Card>
      </div>
    </div>
  );
}
