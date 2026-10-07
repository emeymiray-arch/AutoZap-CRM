import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { EntityActions } from "@/components/crm/EntityActions";
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
