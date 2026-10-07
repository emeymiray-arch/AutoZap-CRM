import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EntityActions } from "@/components/crm/EntityActions";
import { PERSON_STATUS_LABELS } from "@/lib/labels";
import { canHardDelete } from "@/lib/permissions";

export default async function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const person = await prisma.person.findUnique({
    where: { id },
    include: { responsible: true },
  });
  if (!person) notFound();

  const rows: [string, string | null | undefined][] = [
    ["Телефон", person.phone],
    ["Город", person.city],
    ["Ответственный", person.responsible?.name],
    ["Комментарий", person.comment],
  ];

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title={person.name}
        description="Частник"
        actions={
          <EntityActions
            entity="person"
            id={person.id}
            archived={person.archivedAt}
            canDelete={canHardDelete(session.user.role)}
            editHref={`/people/${person.id}/edit`}
            restoreTo={`/people/${person.id}`}
          />
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge status={person.status}>{PERSON_STATUS_LABELS[person.status] || person.status}</Badge>
        <Button href="/people?view=funnel" size="sm" variant="secondary">
          Воронка
        </Button>
      </div>
      <Card title="Карточка">
        <dl className="grid gap-3 text-sm">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-slate-500">{k}</dt>
              <dd className="font-medium whitespace-pre-wrap">{v || "—"}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
