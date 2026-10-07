import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EntityActions } from "@/components/crm/EntityActions";
import { PARTNER_STATUS_LABELS } from "@/lib/labels";
import { canHardDelete } from "@/lib/permissions";

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: { company: true, contact: true, responsible: true },
  });
  if (!partner) notFound();
  const contactLabel = partner.contact
    ? [partner.contact.firstName, partner.contact.lastName].filter(Boolean).join(" ")
    : null;

  const rows: [string, string | null | undefined][] = [
    ["Телефон", partner.company?.phone],
    ["Город", partner.company?.city || partner.region],
    ["Магазины", partner.company?.storeCities],
    ["Склады", partner.company?.warehouseCities],
    ["Производство", partner.company?.productionCities],
    [
      "Контакт",
      contactLabel
        ? `${contactLabel}${partner.contact?.phone ? ` · ${partner.contact.phone}` : ""}`
        : null,
    ],
    ["Ответственный", partner.responsible?.name],
    ["Комментарий", partner.comment],
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={partner.name}
        description="Партнёр"
        actions={
          <EntityActions
            entity="partner"
            id={partner.id}
            archived={partner.archivedAt}
            canDelete={canHardDelete(session.user.role)}
            editHref={`/partners/${partner.id}/edit`}
            restoreTo={`/partners/${partner.id}`}
          />
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge status={partner.status}>{PARTNER_STATUS_LABELS[partner.status] || partner.status}</Badge>
        <Button href="/partners?view=funnel" size="sm" variant="secondary">
          Воронка
        </Button>
      </div>
      <Card title="Карточка">
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className={k === "Комментарий" || k === "Контакт" ? "sm:col-span-2" : ""}>
              <dt className="text-xs text-slate-500">{k}</dt>
              <dd className="font-medium whitespace-pre-wrap">{v || "—"}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
